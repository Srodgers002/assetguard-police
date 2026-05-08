from database import SessionLocal, engine
import models
from auth import get_password_hash
from datetime import datetime, timedelta

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing data
db.query(models.Assignment).delete()
db.query(models.Asset).delete()
db.query(models.Employee).delete()
db.query(models.User).delete()
db.commit()

# Admin users
users = [
    models.User(username="admin", hashed_password=get_password_hash("admin123"), role="admin"),
    models.User(username="manager", hashed_password=get_password_hash("manager123"), role="manager"),
]
db.add_all(users)
db.commit()

# Assets - Laptops and Mobiles
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

# Employees
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

# Assignments for assigned assets
now = datetime.utcnow()
assignments_data = [
    # asset index, employee index, days_ago, expected_return_days, notes
    (0, 0, 60, 30, "Assigned for administrative work"),
    (1, 1, 45, 15, "Assigned for cyber investigation"),
    (3, 3, 30, None, "Assigned for traffic management"),
    (5, 6, 90, -10, "Assigned for record management"),  # overdue
    (6, 5, 20, 60, "Assigned to SP office for official use"),
    (7, 4, 15, 30, "Field duty assignment"),
    (9, 10, 10, 20, "Official communication device"),
    (11, 9, 5, 25, "Field operation mobile"),
]

for asset_idx, emp_idx, days_ago, ret_days, notes in assignments_data:
    asset = asset_objs[asset_idx]
    emp = emp_objs[emp_idx]
    assigned_dt = now - timedelta(days=days_ago)
    exp_return = None
    if ret_days is not None:
        exp_return = assigned_dt + timedelta(days=(days_ago + ret_days))

    asgn = models.Assignment(
        asset_id=asset.id,
        employee_id=emp.id,
        assigned_by="admin",
        assigned_date=assigned_dt,
        expected_return_date=exp_return,
        notes=notes,
        status="active",
    )
    db.add(asgn)

# Add some returned history
returned_history = [
    (2, 2, 120, 90, "Good", "Returned in good condition after training"),
    (8, 7, 180, 150, "Good", "Returned after field duty"),
]
for asset_idx, emp_idx, days_ago, ret_days_ago, condition, notes in returned_history:
    asset = asset_objs[asset_idx]
    emp = emp_objs[emp_idx]
    assigned_dt = now - timedelta(days=days_ago)
    returned_dt = now - timedelta(days=ret_days_ago)
    asgn = models.Assignment(
        asset_id=asset.id,
        employee_id=emp.id,
        assigned_by="admin",
        assigned_date=assigned_dt,
        returned_date=returned_dt,
        condition_on_return=condition,
        notes=notes,
        status="returned",
    )
    db.add(asgn)

db.commit()
print("Database seeded successfully!")
print(f"Users: admin/admin123, manager/manager123")
print(f"Assets: {len(assets_data)}, Employees: {len(employees_data)}")
db.close()
