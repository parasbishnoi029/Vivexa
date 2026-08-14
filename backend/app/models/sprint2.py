from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EDITOR = "editor"
    VIEWER = "viewer"

class PlanType(str, enum.Enum):
    FREE = "free"
    STUDENT = "student"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.VIEWER)
    plan = Column(Enum(PlanType), default=PlanType.FREE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False)
    workspaces = relationship("WorkspaceMember", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    full_name = Column(String)
    avatar_url = Column(String)
    bio = Column(Text)
    company = Column(String)
    country = Column(String)
    language = Column(String, default="en")
    timezone = Column(String, default="UTC")
    theme_preference = Column(String, default="system")
    
    user = relationship("User", back_populates="profile")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    is_personal = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    members = relationship("WorkspaceMember", back_populates="workspace")
    projects = relationship("Project", back_populates="workspace")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    user_id = Column(String, ForeignKey("users.id"))
    role = Column(Enum(UserRole), default=UserRole.VIEWER)
    
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspaces")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    name = Column(String, index=True)
    description = Column(Text)
    industry = Column(String)
    business_goal = Column(String)
    color = Column(String)
    icon = Column(String)
    tags = Column(JSON)
    owner_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="active")
    is_favorite = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    workspace = relationship("Workspace", back_populates="projects")
    activity = relationship("ProjectActivity", back_populates="project")

class ProjectActivity(Base):
    __tablename__ = "project_activity"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    action = Column(String)
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="activity")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String)
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)
    resource_type = Column(String)
    resource_id = Column(String)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="audit_logs")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    plan_id = Column(String, ForeignKey("plans.id"))
    status = Column(String, default="active")
    renews_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Plan(Base):
    __tablename__ = "plans"
    id = Column(String, primary_key=True)
    name = Column(String)
    price = Column(String)
    features = Column(JSON)

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    preferences = Column(JSON)

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True))
    
    user = relationship("User")

class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id = Column(String, primary_key=True)
    is_enabled = Column(Boolean, default=False)
    description = Column(Text)
