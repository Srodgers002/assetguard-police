import json
import re
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

import models
from auth import create_access_token, get_password_hash, verify_password, verify_token
from database import SessionLocal, engine, get_db

ASSET_TYPES = {"NEW", "RETURN", "MISCELLANEOUS"}
REQUEST_STATUSES = {"Pending", "Approved", "Rejected", "Assigned", "Completed"}
MASTER_KEY = "GOVT-50000"


def normalize_asset_type(value: str) -> str:
    cleaned = (value or "").strip().upper()
    if cleaned == "MISC":
        cleaned = "MISCELLANEOUS"
    if cleaned not in ASSET_TYPES:
        raise ValueError("Asset type must be New, Return, or Miscellaneous")
    return cleaned


def public_asset_type(value: str) -> str:
    return (value or "NEW").title()


def json_or_empty(value, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def serialize_asset(asset: models.Asset, include_assignments: bool = True):
    active = None
    if include_assignments:
        active = next((x for x in asset.assignments if x.status == "active"), None)
    return {
        "id": asset.id,
        "asset_id": asset.asset_id,
        "name": asset.name,
        "asset_type": public_asset_type(asset.asset_type),
        "company": asset.company,
        "serial_number": asset.serial_number,
        "category": asset.category,
        "subcategory": asset.subcategory,
        "current_location": asset.current_location,
        "asset_images": json_or_empty(asset.asset_images, []),
        "permission_document": json_or_empty(asset.permission_document, None),
        "description": asset.description,
        "cost": asset.cost,
        "purchase_date": asset.purchase_date,
        "status": asset.status,
        "assigned_to": active.employee.name if active and active.employee else None,
    }


def table_columns(table_name: str):
    with engine.connect() as conn:
        rows = conn.execute(sql_text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def add_column_if_missing(table_name: str, column_name: str, definition: str):
    if column_name in table_columns(table_name):
        return
    with engine.begin() as conn:
        conn.execute(sql_text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))


def run_migrations():
    models.Base.metadata.create_all(bind=engine)

    for column, definition in [
        ("asset_id", "VARCHAR"),
        ("category", "VARCHAR"),
        ("subcategory", "VARCHAR"),
        ("current_location", "VARCHAR"),
        ("asset_images", "TEXT"),
        ("permission_document", "TEXT"),
        ("description", "TEXT"),
        ("cost", "FLOAT"),
    ]:
        add_column_if_missing("assets", column, definition)

    for column, definition in [
        ("employee_id", "INTEGER"),
        ("master_key", "VARCHAR"),
    ]:
        add_column_if_missing("users", column, definition)

    if "location" in table_columns("assets"):
        with engine.begin() as conn:
            conn.execute(sql_text("UPDATE assets SET current_location = location WHERE (current_location IS NULL OR current_location = '') AND location IS NOT NULL"))

    db = SessionLocal()
    try:
        assets = db.query(models.Asset).order_by(models.Asset.id).all()
        for asset in assets:
            if not asset.asset_id:
                asset.asset_id = f"AST-{asset.id:06d}"
            try:
                asset.asset_type = normalize_asset_type(asset.asset_type)
            except ValueError:
                asset.asset_type = "NEW"
            if not asset.current_location:
                legacy_location = getattr(asset, "location", None)
                asset.current_location = legacy_location or "Unassigned Store"
            if asset.asset_images is None:
                asset.asset_images = "[]"
        db.commit()
    finally:
        db.close()


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            employees_data = [
                {"name": "Rajesh Kumar Singh", "employee_id": "UP001", "department": "Headquarters", "rank": "Inspector", "email": "rajesh.singh@mordabadpolice.up.gov.in", "phone": "9876543201"},
                {"name": "Priya Sharma", "employee_id": "UP002", "department": "Cyber Cell", "rank": "Sub-Inspector", "email": "priya.sharma@mordabadpolice.up.gov.in", "phone": "9876543202"},
                {"name": "Amit Verma", "employee_id": "UP003", "department": "Control Room", "rank": "Constable", "email": "amit.verma@mordabadpolice.up.gov.in", "phone": "9876543203"},
            ]
            employees = []
            for item in employees_data:
                employee = models.Employee(**item)
                db.add(employee)
                employees.append(employee)
            db.commit()
            for employee in employees:
                db.refresh(employee)

            users = [
                models.User(username="admin", hashed_password=get_password_hash("admin123"), role="admin", master_key=MASTER_KEY),
                models.User(username="employee", hashed_password=get_password_hash("employee123"), role="employee", employee_id=employees[0].id),
            ]
            db.add_all(users)

            assets_data = [
                {"asset_id": "AST-000001", "name": "Dell Latitude 5540", "asset_type": "NEW", "company": "Dell", "serial_number": "DL001234", "category": "Electronics", "subcategory": "Laptop", "current_location": "Headquarters", "status": "available"},
                {"asset_id": "AST-000002", "name": "HP LaserJet Printer", "asset_type": "RETURN", "company": "HP", "serial_number": "HPPR002345", "category": "Electronics", "subcategory": "Printer", "current_location": "Cyber Cell", "status": "available"},
                {"asset_id": "AST-000003", "name": "Office Stationery Purchase", "asset_type": "MISCELLANEOUS", "company": "Local Vendor", "serial_number": "MISC003", "current_location": "Record Room", "description": "Paper, files, pens, and toner stock", "cost": 18500, "status": "available"},
                {"asset_id": "AST-000004", "name": "Godrej Steel Cabinet", "asset_type": "NEW", "company": "Godrej", "serial_number": "GD004", "category": "Furniture", "subcategory": "Cabinet", "current_location": "SP Office", "status": "available"},
            ]
            db.add_all([models.Asset(asset_images="[]", **item) for item in assets_data])
            db.commit()
        else:
            if not db.query(models.User).filter(models.User.username == "employee").first():
                first_employee = db.query(models.Employee).first()
                db.add(models.User(username="employee", hashed_password=get_password_hash("employee123"), role="employee", employee_id=first_employee.id if first_employee else None))
            admin = db.query(models.User).filter(models.User.username == "admin").first()
            if admin and not admin.master_key:
                admin.master_key = MASTER_KEY
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    seed_if_empty()
    yield


app = FastAPI(title="AssetGuard Government Asset Management", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    employee_id: Optional[int] = None


class AssetCreate(BaseModel):
    name: str
    asset_type: str
    company: str
    serial_number: str
    current_location: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    asset_images: List[dict] = Field(default_factory=list)
    permission_document: Optional[dict] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    purchase_date: Optional[str] = None

    @field_validator("asset_type")
    @classmethod
    def valid_type(cls, value):
        return normalize_asset_type(value)

    @field_validator("cost")
    @classmethod
    def valid_misc_cost(cls, value):
        if value is not None and value > 50000:
            raise ValueError("Miscellaneous asset cost cannot exceed Rs 50,000.")
        return value


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    company: Optional[str] = None
    serial_number: Optional[str] = None
    current_location: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    asset_images: Optional[List[dict]] = None
    permission_document: Optional[dict] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    purchase_date: Optional[str] = None

    @field_validator("asset_type")
    @classmethod
    def valid_type(cls, value):
        return normalize_asset_type(value) if value else value

    @field_validator("cost")
    @classmethod
    def valid_misc_cost(cls, value):
        if value is not None and value > 50000:
            raise ValueError("Miscellaneous asset cost cannot exceed Rs 50,000.")
        return value


class EmployeeCreate(BaseModel):
    name: str
    employee_id: str
    department: str
    rank: str
    email: str
    phone: str


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    rank: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class AssignmentCreate(BaseModel):
    asset_id: int
    employee_id: int
    notes: Optional[str] = None


class BulkAssignmentCreate(BaseModel):
    asset_ids: List[int]
    employee_id: int
    notes: Optional[str] = None
    master_key: Optional[str] = None


class RequestCreate(BaseModel):
    asset_id: int
    notes: Optional[str] = None


class RequestUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    employee_id: Optional[int] = None

    @field_validator("status")
    @classmethod
    def valid_status(cls, value):
        if value not in REQUEST_STATUSES:
            raise ValueError("Invalid request status")
        return value


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def current_employee(current_user: models.User, db: Session):
    if current_user.employee_id:
        employee = db.query(models.Employee).filter(models.Employee.id == current_user.employee_id).first()
        if employee:
            return employee
    employee = db.query(models.Employee).filter(models.Employee.employee_id == current_user.username).first()
    if employee:
        return employee
    raise HTTPException(status_code=403, detail="Employee profile is not linked to this account")


def next_asset_id(db: Session):
    max_number = 0
    for (value,) in db.query(models.Asset.asset_id).all():
        match = re.match(r"AST-(\d+)$", value or "")
        if match:
            max_number = max(max_number, int(match.group(1)))
    return f"AST-{max_number + 1:06d}"


def validate_asset_payload(asset):
    if asset.asset_type in {"NEW", "RETURN"}:
        if not asset.category or not asset.subcategory:
            raise HTTPException(status_code=400, detail="Category and subcategory are required for New and Return assets")
    if asset.asset_type == "MISCELLANEOUS" and asset.cost is not None and asset.cost > 50000:
        raise HTTPException(status_code=400, detail="Miscellaneous asset cost cannot exceed Rs 50,000.")


@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "role": user.role, "employee_id": user.employee_id}


@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role, "employee_id": current_user.employee_id}


@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    assets = db.query(models.Asset).all()
    active_assignments = db.query(models.Assignment).filter(models.Assignment.status == "active").count()
    pending_requests = db.query(models.AssetRequest).filter(models.AssetRequest.status == "Pending").count()

    by_type = {}
    by_category = {}
    for asset in assets:
        by_type[public_asset_type(asset.asset_type)] = by_type.get(public_asset_type(asset.asset_type), 0) + 1
        if asset.category:
            by_category[asset.category] = by_category.get(asset.category, 0) + 1

    recent = db.query(models.Assignment).order_by(models.Assignment.assigned_date.desc()).limit(5).all()
    return {
        "total_assets": len(assets),
        "total_employees": db.query(models.Employee).count(),
        "assigned_assets": active_assignments,
        "available_assets": sum(1 for asset in assets if asset.status == "available"),
        "pending_requests": pending_requests,
        "overdue_count": 0,
        "by_type": by_type,
        "by_category": by_category,
        "recent_assignments": [
            {
                "id": item.id,
                "asset": item.asset.name if item.asset else "",
                "asset_id": item.asset.asset_id if item.asset else "",
                "asset_type": public_asset_type(item.asset.asset_type) if item.asset else "",
                "employee": item.employee.name if item.employee else "",
                "assigned_date": item.assigned_date.strftime("%b %d, %Y") if item.assigned_date else "",
                "assigned_by": item.assigned_by,
                "status": item.status,
            }
            for item in recent
        ],
    }


@app.get("/assets")
def get_assets(search: str = "", asset_type: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    q = db.query(models.Asset)
    if search:
        q = q.filter(
            (models.Asset.asset_id.contains(search)) |
            (models.Asset.name.contains(search)) |
            (models.Asset.company.contains(search)) |
            (models.Asset.serial_number.contains(search))
        )
    if asset_type:
        q = q.filter(models.Asset.asset_type == normalize_asset_type(asset_type))
    return [serialize_asset(asset) for asset in q.order_by(models.Asset.id.desc()).all()]


@app.get("/assets/available")
def get_available_assets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.Asset).filter(models.Asset.status == "available").order_by(models.Asset.asset_id).all()
    return [serialize_asset(asset, include_assignments=False) for asset in assets]


@app.post("/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    validate_asset_payload(asset)
    if db.query(models.Asset).filter(models.Asset.serial_number == asset.serial_number).first():
        raise HTTPException(status_code=400, detail="Serial number already exists")
    db_asset = models.Asset(
        asset_id=next_asset_id(db),
        name=asset.name,
        asset_type=asset.asset_type,
        company=asset.company,
        serial_number=asset.serial_number,
        category=asset.category if asset.asset_type != "MISCELLANEOUS" else None,
        subcategory=asset.subcategory if asset.asset_type != "MISCELLANEOUS" else None,
        current_location=asset.current_location,
        asset_images=json.dumps(asset.asset_images),
        permission_document=json.dumps(asset.permission_document) if asset.permission_document else None,
        description=asset.description,
        cost=asset.cost,
        purchase_date=asset.purchase_date,
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return serialize_asset(db_asset)


@app.put("/assets/{asset_id}")
def update_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    data = asset.model_dump(exclude_unset=True)
    if "asset_type" in data:
        data["asset_type"] = normalize_asset_type(data["asset_type"])
    asset_type = data.get("asset_type", db_asset.asset_type)
    if asset_type in {"NEW", "RETURN"} and (not data.get("category", db_asset.category) or not data.get("subcategory", db_asset.subcategory)):
        raise HTTPException(status_code=400, detail="Category and subcategory are required for New and Return assets")
    if asset_type == "MISCELLANEOUS" and data.get("cost", db_asset.cost) is not None and data.get("cost", db_asset.cost) > 50000:
        raise HTTPException(status_code=400, detail="Miscellaneous asset cost cannot exceed Rs 50,000.")
    if "asset_images" in data:
        data["asset_images"] = json.dumps(data["asset_images"])
    if "permission_document" in data:
        data["permission_document"] = json.dumps(data["permission_document"]) if data["permission_document"] else None
    if asset_type == "MISCELLANEOUS":
        data["category"] = None
        data["subcategory"] = None
    for key, value in data.items():
        setattr(db_asset, key, value)
    db.commit()
    db.refresh(db_asset)
    return serialize_asset(db_asset)


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if db_asset.status == "assigned":
        raise HTTPException(status_code=400, detail="Cannot delete an assigned asset")
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted"}


@app.get("/employees")
def get_employees(search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    q = db.query(models.Employee)
    if search:
        q = q.filter((models.Employee.name.contains(search)) | (models.Employee.employee_id.contains(search)) | (models.Employee.department.contains(search)))
    return [
        {
            "id": employee.id,
            "name": employee.name,
            "employee_id": employee.employee_id,
            "department": employee.department,
            "rank": employee.rank,
            "email": employee.email,
            "phone": employee.phone,
            "active_assignments": sum(1 for item in employee.assignments if item.status == "active"),
        }
        for employee in q.all()
    ]


@app.post("/employees")
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    if db.query(models.Employee).filter(models.Employee.employee_id == employee.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    db_emp = models.Employee(**employee.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp


@app.put("/employees/{emp_id}")
def update_employee(emp_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in employee.model_dump(exclude_none=True).items():
        setattr(db_emp, key, value)
    db.commit()
    db.refresh(db_emp)
    return db_emp


@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if any(item.status == "active" for item in db_emp.assignments):
        raise HTTPException(status_code=400, detail="Employee has active assignments")
    db.delete(db_emp)
    db.commit()
    return {"message": "Employee deleted"}


@app.get("/assignments")
def get_assignments(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    assignments = db.query(models.Assignment).filter(models.Assignment.status == "active").all()
    return [
        {
            "id": item.id,
            "asset_id": item.asset_id,
            "asset_code": item.asset.asset_id if item.asset else "",
            "asset": item.asset.name if item.asset else "",
            "asset_type": public_asset_type(item.asset.asset_type) if item.asset else "",
            "serial_number": item.asset.serial_number if item.asset else "",
            "employee_id": item.employee_id,
            "employee": item.employee.name if item.employee else "",
            "employee_code": item.employee.employee_id if item.employee else "",
            "department": item.employee.department if item.employee else "",
            "assigned_by": item.assigned_by,
            "assigned_date": item.assigned_date.strftime("%b %d, %Y %H:%M") if item.assigned_date else "",
            "notes": item.notes,
            "status": item.status,
            "is_overdue": False,
        }
        for item in assignments
    ]


def assign_one_asset(db: Session, asset: models.Asset, employee: models.Employee, assigned_by: str, notes: Optional[str]):
    if asset.status != "available":
        raise HTTPException(status_code=400, detail=f"{asset.asset_id} is not available")
    assignment = models.Assignment(asset_id=asset.id, employee_id=employee.id, assigned_by=assigned_by, notes=notes)
    asset.status = "assigned"
    db.add(assignment)
    return assignment


@app.post("/assignments")
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    asset = db.query(models.Asset).filter(models.Asset.id == assignment.asset_id).first()
    employee = db.query(models.Employee).filter(models.Employee.id == assignment.employee_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db_assignment = assign_one_asset(db, asset, employee, current_user.username, assignment.notes)
    db.commit()
    db.refresh(db_assignment)
    return {"message": "Asset assigned successfully", "id": db_assignment.id}


@app.post("/assignments/bulk")
def create_bulk_assignment(payload: BulkAssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    if len(payload.asset_ids) > 10 and payload.master_key != (current_user.master_key or MASTER_KEY):
        raise HTTPException(status_code=403, detail="Valid master key required for large bulk assignments")
    employee = db.query(models.Employee).filter(models.Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    assignments = []
    for asset_id in payload.asset_ids:
        asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
        assignments.append(assign_one_asset(db, asset, employee, current_user.username, payload.notes))
    db.commit()
    return {"message": f"{len(assignments)} assets assigned successfully", "assigned_count": len(assignments)}


@app.get("/my-assets")
def get_my_assets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    employee = current_employee(current_user, db)
    assignments = db.query(models.Assignment).filter(models.Assignment.employee_id == employee.id, models.Assignment.status == "active").all()
    return [
        {
            "assignment_id": item.id,
            "assigned_date": item.assigned_date.strftime("%b %d, %Y") if item.assigned_date else "",
            "notes": item.notes,
            **serialize_asset(item.asset, include_assignments=False),
        }
        for item in assignments
        if item.asset
    ]


@app.get("/requests")
def get_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.AssetRequest)
    if current_user.role != "admin":
        employee = current_employee(current_user, db)
        q = q.filter(models.AssetRequest.employee_id == employee.id)
    return [
        {
            "id": item.id,
            "asset": serialize_asset(item.asset, include_assignments=False) if item.asset else None,
            "employee": item.employee.name if item.employee else "",
            "employee_code": item.employee.employee_id if item.employee else "",
            "department": item.employee.department if item.employee else "",
            "requested_by": item.requested_by,
            "status": item.status,
            "notes": item.notes,
            "admin_notes": item.admin_notes,
            "created_at": item.created_at.strftime("%b %d, %Y %H:%M") if item.created_at else "",
        }
        for item in q.order_by(models.AssetRequest.created_at.desc()).all()
    ]


@app.post("/requests")
def create_request(payload: RequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    employee = current_employee(current_user, db)
    asset = db.query(models.Asset).filter(models.Asset.id == payload.asset_id, models.Asset.status == "available").first()
    if not asset:
        raise HTTPException(status_code=404, detail="Available asset not found")
    existing = db.query(models.AssetRequest).filter(
        models.AssetRequest.asset_id == asset.id,
        models.AssetRequest.employee_id == employee.id,
        models.AssetRequest.status.in_(["Pending", "Approved"]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active request for this asset")
    req = models.AssetRequest(asset_id=asset.id, employee_id=employee.id, requested_by=current_user.username, notes=payload.notes)
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"message": "Asset request submitted", "id": req.id}


@app.patch("/requests/{request_id}")
def update_request(request_id: int, payload: RequestUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    req = db.query(models.AssetRequest).filter(models.AssetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = payload.status
    req.admin_notes = payload.admin_notes
    if payload.employee_id:
        req.employee_id = payload.employee_id
    if payload.status == "Assigned":
        asset = req.asset
        employee = req.employee
        if not asset or not employee:
            raise HTTPException(status_code=400, detail="Request is missing asset or employee")
        if asset.status == "available":
            assign_one_asset(db, asset, employee, current_user.username, req.notes)
        else:
            raise HTTPException(status_code=400, detail="Requested asset is no longer available")
    db.commit()
    return {"message": "Request updated"}


@app.get("/history")
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    history = db.query(models.Assignment).order_by(models.Assignment.assigned_date.desc()).all()
    return [
        {
            "id": item.id,
            "asset": item.asset.name if item.asset else "",
            "asset_id": item.asset.asset_id if item.asset else "",
            "asset_type": public_asset_type(item.asset.asset_type) if item.asset else "",
            "serial_number": item.asset.serial_number if item.asset else "",
            "employee": item.employee.name if item.employee else "",
            "employee_code": item.employee.employee_id if item.employee else "",
            "department": item.employee.department if item.employee else "",
            "assigned_by": item.assigned_by,
            "assigned_date": item.assigned_date.strftime("%b %d, %Y %H:%M") if item.assigned_date else "",
            "returned_date": item.returned_date.strftime("%b %d, %Y %H:%M") if item.returned_date else None,
            "notes": item.notes,
            "status": item.status,
            "is_overdue": False,
        }
        for item in history
    ]
