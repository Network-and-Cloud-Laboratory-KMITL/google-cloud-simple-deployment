FROM python:3.14 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .


FROM python:3.14-slim

WORKDIR /app

RUN apt-get update && apt-get upgrade -y

COPY --from=builder /usr/local/lib/python3.14/site-packages /usr/local/lib/python3.14/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN groupadd -r nonroot && useradd -r -g nonroot nonroot
USER nonroot

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]