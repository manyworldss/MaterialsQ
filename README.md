# MaterialIQ (Beta)

An AI-powered browser extension that analyzes product quality, material composition, and value for money while shopping online.

## Overview

Consumers spend hundreds of dollars on products assuming high quality, often struggling to understand material blends, construction details, and fair pricing. MaterialIQ aims to remove that uncertainty by providing objective, transparent scoring for products across the web.

## Features

- **Material Quality Score:** Analysis based on fiber composition and fabric weight.
- **Durability Estimate:** Inferred from materials and construction cues.
- **Value Score:** An objective calculation determining if the item is worth its asking price.
- **Transparent Methodology:** Clear, rule-based scoring engines so users understand exactly how scores are derived.

## Project Structure

This repository contains the full stack for the MaterialIQ beta:

- `/extension`: The Chrome extension built with React, Vite, TailwindCSS, and Manifest V3.
- `/backend`: A lightweight Python/FastAPI backend containing the deterministic scoring engine and API endpoints.

## Local Development

### Extension
```bash
cd extension
npm install
npm run dev
```

### Backend API
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```
