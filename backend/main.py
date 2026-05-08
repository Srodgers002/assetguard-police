from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import models
from database import engine, SessionLocal, get_db
from auth import verify_password, get_password_hash, create_access_token, verify_token
from contextlib import asynccontextmanager

def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return
        users = [
            models.User(username="admin", hashed_password=get_password_hash("admin123"), role="admin"),
            models.User(username="manager", hashed_password=get_password_hash("manager123"), role="manager"),
        ]
        db.add_all(users)
        db.commit()
        assets_data = [
            {"name": "Dell Latitude 5540", "asset_type": "laptop", "company": "Dell", "model_no": "LAT-5540-I5", "serial_number": "DL001234", "warranty": "Mar 2026", "condition": "Excellent", "purchase_date": "Mar 15, 2023", "location": "Headquarters", "status": "assigned"},
            {"name": "HP EliteBook 840", "asset_type": "laptop", "company": "HP", "model_no": "EB840-G10", "serial_number": "HP002345", "warranty": "Jun 2026", "condition": "Good", "purchase_date": "Jun 10, 2023", "location": "Cyber Cell", "status": "assigned"},
            {"name": "Lenovo ThinkPad E15", "asset_type": "laptop", "company": "Lenovo", "model_no": "TP-E15-G4", "serial_number": "LN003456", "warranty": "Aug 2025", "condition": "Good", "purchase_date": "Aug 20, 2022", "location": "Control Room", "status": "available"},
            {"name": "Dell Inspiron 3530", "asset_type": "laptop", "company": "Dell", "model_no": "INS-3530-I3", "serial_number": "DL004567", "warranty": "Nov 2026", "condition": "Excellent", "purchase_date": "Nov 5, 2023", "location": "Headquarters", "status": "assigned"},
            {"name": "HP ProBook 450 G10", "asset_type": "laptop", "company": "HP", "model_no": "PB450-G10", "serial_number": "HP005678", "warranty": "Jan 2027", "condition": "Excellent", "purchase_date": "Jan 12, 2024", "location": "Traffic Department", "status": "available"},
            {"name": "Acer Aspire 5", "asset_type": "laptop", "company": "Acer", "model_no": "A515-58M", "serial_number": "AC006789", "warranty": "Apr 2025", "condition": "Fair", "purchase_date": "Apr 8, 2022", "location": "Record Room", "status": "assigned"},
            {"name": "Apple MacBook Air M2", "asset_type": "laptop", "company": "Apple", "model_no": "MBA-M2-2023", "serial_number": "AP007890", "warranty": "Sep 2026", "condition": "Excellent", "purchase_date": "Sep 1, 2023", "location": "SP Office", "status": "assigned"},
            {"name": "Samsung Galaxy A54", "asset_type": "mobile", "company": "Samsung", "model_no": "SM-A546B", "serial_number": "SG008901", "warranty": "Feb 2025", "condition": "Good", "purchase_date": "Feb 18, 2023", "location": "Field Unit", "status": "assigned"},
            {"name": "Samsung Galaxy A34", "asset_type": "mobile", "company": "Samsung", "model_no": "SM-A346B", "serial_number": "SG009012", "warranty": "May 2025", "condition": "Good", "purchase_date": "May 22, 2023", "location": "Field Unit", "status": "available"},
            {"name": "iPhone 14", "asset_type": "mobile", "company": "Apple", "model_no": "A2882", "serial_number": "AP010123", "warranty": "Oct 2025", "condition": "Excellent", "purchase_date": "Oct 10, 2023", "location": "SP Office", "status": "assigned"},
            {"name": "Vivo Y200", "asset_type": "mobile", "company": "Vivo", "model_no": "V2309", "serial_number": "VV011234", "warranty": "Dec 2025", "condition": "Excellent", "purchase_date": "Dec 5, 2023", "location": "Headquarters", "status": "available"},
            {"name": "Realme Narzo 60", "asset_type": "mobile", "company": "Realme", "model_no": "RMX3782", "serial_number": "RM012345", "warranty": "Jul 2025", "condition": "Good", "purchase_date": "Jul 14, 2023", "location": "Field Unit", "status": "assigned"},
            {"name": "MI Redmi Note 13", "asset_type": "mobile", "company": "Xiaomi", "model_no": "2312DRAABL", "serial_number": "XI013456", "warranty": "Jan 2026", "condition": "Excellent", "purchase_date": "Jan 20, 2024", "location": "Cyber Cell", "status": "available"},
        ]
        asset_objs = []
        for a in assets_data:
            obj = models.Asset(**a)
            db.add(obj)
            asset_objs.append(obj)
        db.commit()
        for o in asset_objs:
            db.refresh(o)
        employees_data = [
            {"name": "Rajesh Kumar Singh", "employee_id": "UP001", "department": "Headquarters", "rank": "Inspector", "email": "rajesh.singh@mordabadpolice.up.gov.in", "phone": "9876543201"},
            {"name": "Priya Sharma", "employee_id": "UP002", "department": "Cyber Cell", "rank": "Sub-Inspector", "email": "priya.sharma@mordabadpolice.up.gov.in", "phone": "9876543202"},
            {"name": "Amit Verma", "employee_id": "UP003", "department": "Control Room", "rank": "Constable", "email": "amit.verma@mordabadpolice.up.gov.in", "phone": "9876543203"},
            {"name": "Sunita Devi", "employee_id": "UP004", "department": "Traffic Department", "rank": "Head Constable", "email": "sunita.devi@mordabadpolice.up.gov.in", "phone": "9876543204"},
            {"name": "Mohd. Asif Khan", "employee_id": "UP005", "department": "Field Unit", "rank": "Constable", "email": "asif.khan@mordabadpolice.up.gov.in", "phone": "9876543205"},
            {"name": "Deepak Yadav", "employee_id": "UP006", "department": "SP Office", "rank": "Deputy Superintendent", "email": "deepak.yadav@mordabadpolice.up.gov.in", "phone": "9876543206"},
            {"name": "Kavita Tiwari", "employee_id": "UP007", "department": "Record Room", "rank": "Head Constable", "email": "kavita.tiwari@mordabadpolice.up.gov.in", "phone": "9876543207"},
            {"name": "Sanjay Gupta", "employee_id": "UP008", "department": "Cyber Cell", "rank": "Inspector", "email": "sanjay.gupta@mordabadpolice.up.gov.in", "phone": "9876543208"},
            {"name": "Rekha Patel", "employee_id": "UP009", "department": "Headquarters", "rank": "Sub-Inspector", "email": "rekha.patel@mordabadpolice.up.gov.in", "phone": "9876543209"},
            {"name": "Vikas Mishra", "employee_id": "UP010", "department": "Field Unit", "rank": "Constable", "email": "vikas.mishra@mordabadpolice.up.gov.in", "phone": "9876543210"},
            {"name": "Anita Chauhan", "employee_id": "UP011", "department": "SP Office", "rank": "Inspector", "email": "anita.chauhan@mordabadpolice.up.gov.in", "phone": "9876543211"},
            {"name": "Ramesh Prasad", "employee_id": "UP012", "department": "Traffic Department", "rank": "Constable", "email": "ramesh.prasad@mordabadpolice.up.gov.in", "phone": "9876543212"},
        ]
        emp_objs = []
        for e in employees_data:
            obj = models.Employee(**e)
            db.add(obj)
            emp_objs.append(obj)
        db.commit()
        for o in emp_objs:
            db.refresh(o)
        now = datetime.utcnow()
        assignments = [
            (0, 0, 60, 30, "Assigned for administrative work"),
            (1, 1, 45, 15, "Assigned for cyber investigation"),
            (3, 3, 30, None, "Assigned for traffic management"),
            (5, 6, 90, -10, "Assigned for record management"),
            (6, 5, 20, 60, "Assigned to SP office for official use"),
            (7, 4, 15, 30, "Field duty assignment"),
            (9, 10, 10, 20, "Official communication device"),
            (11, 9, 5, 25, "Field operation mobile"),
        ]
        for ai, ei, days_ago, ret_days, notes in assignments:
            asset = asset_objs[ai]
            emp = emp_objs[ei]
            assigned_dt = now - timedelta(days=days_ago)
            exp_return = None
            if ret_days is not None:
                exp_return = assigned_dt + timedelta(days=(days_ago + ret_days))
            asgn = models.Assignment(asset_id=asset.id, employee_id=emp.id, assigned_by="admin", assigned_date=assigned_dt, expected_return_date=exp_return, notes=notes, status="active")
            db.add(asgn)
        for ai, ei, days_ago, ret_days_ago, condition, notes in [(2, 2, 120, 90, "Good", "Returned after training"), (8, 7, 180, 150, "Good", "Returned after field duty")]:
            asset = asset_objs[ai]
            emp = emp_objs[ei]
            asgn = models.Assignment(asset_id=asset.id, employee_id=emp.id, assigned_by="admin", assigned_date=now - timedelta(days=days_ago), returned_date=now - timedelta(days=ret_days_ago), condition_on_return=condition, notes=notes, status="returned")
            db.add(asgn)
        db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    seed_if_empty()
    yield

app = FastAPI(title="AssetGuard - Mordabad Police Line", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---- Schemas ----
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

class AssetCreate(BaseModel):
    name: str
    asset_type: str
    company: str
    model_no: str
    serial_number: str
    warranty: str
    condition: str
    purchase_date: str
    location: str

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    model_no: Optional[str] = None
    warranty: Optional[str] = None
    condition: Optional[str] = None
    purchase_date: Optional[str] = None
    location: Optional[str] = None

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
    expected_return_date: Optional[str] = None

class UnassignRequest(BaseModel):
    assignment_id: int
    condition_on_return: str
    notes: Optional[str] = None

# ---- Auth ----
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "role": user.role}

@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role}

# ---- Dashboard ----
@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_assets = db.query(models.Asset).count()
    total_employees = db.query(models.Employee).count()
    assigned_assets = db.query(models.Asset).filter(models.Asset.status == "assigned").count()
    available_assets = db.query(models.Asset).filter(models.Asset.status == "available").count()

    now = datetime.utcnow()
    overdue = db.query(models.Assignment).filter(
        models.Assignment.status == "active",
        models.Assignment.expected_return_date != None,
        models.Assignment.expected_return_date < now
    ).count()

    by_type = {}
    for asset in db.query(models.Asset).all():
        t = asset.asset_type
        by_type[t] = by_type.get(t, 0) + 1

    by_condition = {}
    for asset in db.query(models.Asset).all():
        c = asset.condition
        by_condition[c] = by_condition.get(c, 0) + 1

    recent = db.query(models.Assignment).order_by(models.Assignment.assigned_date.desc()).limit(5).all()
    recent_list = []
    for a in recent:
        recent_list.append({
            "id": a.id,
            "asset": a.asset.name if a.asset else "",
            "asset_type": a.asset.asset_type if a.asset else "",
            "employee": a.employee.name if a.employee else "",
            "assigned_date": a.assigned_date.strftime("%b %d, %Y") if a.assigned_date else "",
            "assigned_by": a.assigned_by,
            "status": a.status,
        })

    return {
        "total_assets": total_assets,
        "total_employees": total_employees,
        "assigned_assets": assigned_assets,
        "available_assets": available_assets,
        "overdue_count": overdue,
        "by_type": by_type,
        "by_condition": by_condition,
        "recent_assignments": recent_list,
    }

# ---- Assets ----
@app.get("/assets")
def get_assets(search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Asset)
    if search:
        q = q.filter(
            (models.Asset.name.contains(search)) |
            (models.Asset.company.contains(search)) |
            (models.Asset.serial_number.contains(search))
        )
    assets = q.all()
    result = []
    for a in assets:
        active = next((x for x in a.assignments if x.status == "active"), None)
        result.append({
            "id": a.id,
            "name": a.name,
            "asset_type": a.asset_type,
            "company": a.company,
            "model_no": a.model_no,
            "serial_number": a.serial_number,
            "warranty": a.warranty,
            "condition": a.condition,
            "purchase_date": a.purchase_date,
            "location": a.location,
            "status": a.status,
            "assigned_to": active.employee.name if active and active.employee else None,
        })
    return result

@app.post("/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Asset).filter(models.Asset.serial_number == asset.serial_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already exists")
    db_asset = models.Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.put("/assets/{asset_id}")
def update_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for k, v in asset.dict(exclude_none=True).items():
        setattr(db_asset, k, v)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if db_asset.status == "assigned":
        raise HTTPException(status_code=400, detail="Cannot delete an assigned asset")
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted"}

# ---- Employees ----
@app.get("/employees")
def get_employees(search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Employee)
    if search:
        q = q.filter(
            (models.Employee.name.contains(search)) |
            (models.Employee.employee_id.contains(search)) |
            (models.Employee.department.contains(search))
        )
    employees = q.all()
    result = []
    for e in employees:
        active_count = sum(1 for a in e.assignments if a.status == "active")
        result.append({
            "id": e.id,
            "name": e.name,
            "employee_id": e.employee_id,
            "department": e.department,
            "rank": e.rank,
            "email": e.email,
            "phone": e.phone,
            "active_assignments": active_count,
        })
    return result

@app.post("/employees")
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Employee).filter(models.Employee.employee_id == employee.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    db_emp = models.Employee(**employee.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.put("/employees/{emp_id}")
def update_employee(emp_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for k, v in employee.dict(exclude_none=True).items():
        setattr(db_emp, k, v)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    active = sum(1 for a in db_emp.assignments if a.status == "active")
    if active > 0:
        raise HTTPException(status_code=400, detail="Employee has active assignments")
    db.delete(db_emp)
    db.commit()
    return {"message": "Employee deleted"}

# ---- Assignments ----
@app.get("/assignments")
def get_assignments(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assignments = db.query(models.Assignment).filter(models.Assignment.status == "active").all()
    result = []
    for a in assignments:
        is_overdue = False
        if a.expected_return_date and a.expected_return_date < datetime.utcnow():
            is_overdue = True
        result.append({
            "id": a.id,
            "asset_id": a.asset_id,
            "asset": a.asset.name if a.asset else "",
            "asset_type": a.asset.asset_type if a.asset else "",
            "serial_number": a.asset.serial_number if a.asset else "",
            "employee_id": a.employee_id,
            "employee": a.employee.name if a.employee else "",
            "employee_code": a.employee.employee_id if a.employee else "",
            "department": a.employee.department if a.employee else "",
            "assigned_by": a.assigned_by,
            "assigned_date": a.assigned_date.strftime("%b %d, %Y %H:%M") if a.assigned_date else "",
            "expected_return_date": a.expected_return_date.strftime("%b %d, %Y") if a.expected_return_date else None,
            "notes": a.notes,
            "status": a.status,
            "is_overdue": is_overdue,
        })
    return result

@app.get("/assets/available")
def get_available_assets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.Asset).filter(models.Asset.status == "available").all()
    return [{"id": a.id, "name": a.name, "asset_type": a.asset_type, "serial_number": a.serial_number} for a in assets]

@app.post("/assignments")
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == assignment.asset_id).first()
    if not asset or asset.status != "available":
        raise HTTPException(status_code=400, detail="Asset not available")
    employee = db.query(models.Employee).filter(models.Employee.id == assignment.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    expected_dt = None
    if assignment.expected_return_date:
        try:
            expected_dt = datetime.strptime(assignment.expected_return_date, "%Y-%m-%d")
        except:
            pass

    db_assignment = models.Assignment(
        asset_id=assignment.asset_id,
        employee_id=assignment.employee_id,
        assigned_by=current_user.username,
        notes=assignment.notes,
        expected_return_date=expected_dt,
    )
    asset.status = "assigned"
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return {"message": "Asset assigned successfully", "id": db_assignment.id}

@app.post("/assignments/unassign")
def unassign_asset(req: UnassignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == req.assignment_id).first()
    if not assignment or assignment.status != "active":
        raise HTTPException(status_code=404, detail="Active assignment not found")
    assignment.status = "returned"
    assignment.returned_date = datetime.utcnow()
    assignment.condition_on_return = req.condition_on_return
    if req.notes:
        assignment.notes = (assignment.notes or "") + f" | Return note: {req.notes}"
    assignment.asset.status = "available"
    db.commit()
    return {"message": "Asset unassigned successfully"}

# ---- History ----
@app.get("/history")
def get_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    history = db.query(models.Assignment).order_by(models.Assignment.assigned_date.desc()).all()
    result = []
    for a in history:
        is_overdue = False
        if a.status == "active" and a.expected_return_date and a.expected_return_date < datetime.utcnow():
            is_overdue = True
        result.append({
            "id": a.id,
            "asset": a.asset.name if a.asset else "",
            "asset_type": a.asset.asset_type if a.asset else "",
            "serial_number": a.asset.serial_number if a.asset else "",
            "employee": a.employee.name if a.employee else "",
            "employee_code": a.employee.employee_id if a.employee else "",
            "department": a.employee.department if a.employee else "",
            "assigned_by": a.assigned_by,
            "assigned_date": a.assigned_date.strftime("%b %d, %Y %H:%M") if a.assigned_date else "",
            "expected_return_date": a.expected_return_date.strftime("%b %d, %Y") if a.expected_return_date else None,
            "returned_date": a.returned_date.strftime("%b %d, %Y %H:%M") if a.returned_date else None,
            "condition_on_return": a.condition_on_return,
            "notes": a.notes,
            "status": a.status,
            "is_overdue": is_overdue,
        })
    return result
