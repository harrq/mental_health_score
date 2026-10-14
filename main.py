import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel,Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

#load fast api
app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


#model load
model=joblib.load('Mental_Health_Model.pkl')


#input feature
class Student(BaseModel):
    Age: int=Field(...,ge=10,le=90, description="Age of the student")

    Gender:Literal["Male", "Female", "Other"]
   
    Academic_Level: Literal['Undergraduate', 'Graduate', 'High School']

    Most_Used_Platform:Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
       'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp',
       'WeChat']
    
    Purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']

    Avg_Daily_Usage_Hours:int=Field(..., description="Average daily usage hours of social media")
    Daily_Unlocks: int=Field(..., description="Average daily unlocks of social media apps")
    
    Study_Hours: float=Field(..., description="Average study hours per day")

    Physical_Activity_Hours: float=Field(..., description="Average physical activity hours per day")

    Sleep_Hours_Per_Night: float=Field(..., le=24, description="Average sleep hours per night")

    Stress_Level: Literal['Medium', 'Low', 'Very High', 'High']

    top_country: Literal['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Turkey', 'Mexico', 'France', 'Spain', 'Other']



class PredictionResponse(BaseModel):
    prediction: float


@app.post('/predict', response_model=PredictionResponse)
def input(data: Student):
    data=data.dict()                            
    data=pd.DataFrame([data])
    prediction=model.predict(data)
    return PredictionResponse(prediction=round(float(prediction[0]), 2))
