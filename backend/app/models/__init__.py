"""Import every model so Base.metadata is complete (Alembic, create_all)."""

from app.models.access import (  # noqa: F401
    AccessRequest,
    Announcement,
    AuditLog,
    Institution,
    SupportTicket,
    SystemSetting,
    User,
)
from app.models.config_data import (  # noqa: F401
    CapacityDistrictBeds,
    CapacityProfile,
    DatasetDistrict,
    DatasetVersion,
    DiseasePreset,
    ImportJob,
    InterventionItem,
    InterventionPackage,
    InterventionType,
    PopulationDataset,
)
from app.models.officer import HospitalEntry, Instruction, ResponsePlan  # noqa: F401
from app.models.output import (  # noqa: F401
    CaseDataset,
    CaseRecord,
    InterventionReview,
    PolicyAlert,
    Report,
    ReportExport,
)
from app.models.scenarios import Scenario, ScenarioApproval, ScenarioShare  # noqa: F401
from app.models.simulation import (  # noqa: F401
    BorderRisk,
    ScenarioComparison,
    SimulationResult,
    SimulationRun,
)
