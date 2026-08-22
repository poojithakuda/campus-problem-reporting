from pydantic import BaseModel


class DepartmentResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True