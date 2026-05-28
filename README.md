# AI Car Concept Lab

A stylish three-page Flask app that turns a structured brief into a futuristic car concept.

## Features
- Home, Studio, and History pages
- Structured product brief
- Real AI text generation with Groq when 'GROQ_API_KEY' is set
- Clean local fallback concept generation when no key is set
- Session-based concept history
- Futuristic UI with live colorway cards and SVG concept render
- External concept image via Pollinations image prompt URL

## Folder Structure
```text
ai-car-concept-lab/
├── app.py
├── requirements.txt
├── .env.example
├── README.md
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── studio.html
│   └── history.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── studio.js
```

## Run
```bash
pip install -r requirements.txt
cp .env.example .env
python app.py
```
Then open `http://127.0.0.1:5000`.

## Notes
- If you do not add a Groq key, the app still works using a polished local fallback generator.
- History is stored in the browser session.