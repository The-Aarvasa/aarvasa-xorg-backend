FROM python:3.10-slim

WORKDIR /app

# Optional but recommended for numpy/scipy build issues
RUN apt-get update && apt-get install -y gcc g++ libffi-dev && apt-get clean

# Copy requirements file
COPY requirements.txt .

# Fix: Force compatible numpy version before installing torch
RUN pip install --upgrade pip && \
    pip install numpy==1.26.4 && \ 
    pip install torch==2.2.0+cpu -f https://download.pytorch.org/whl/torch_stable.html && \
    pip install -r requirements.txt

# Copy everything else
COPY . .

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
