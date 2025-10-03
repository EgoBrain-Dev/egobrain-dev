egobrain-dev/
├── index.html                    # Frontend
├── assets/                       # CSS, JS, Images
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   └── utils/helpers.js
│   └── images/logo.jpeg
├── vercel.json                   # Config Vercel
│
├── backend/                      # Flask Backend
│   ├── app.py                    # Arquivo principal
│   ├── models.py                 # Modelos de dados
│   ├── routes/                   # Rotas da API
│   │   ├── products.py
│   │   ├── licenses.py
│   │   └── orders.py
│   ├── utils/
│   │   ├── database.py           # Conexão SQLite
│   │   └── helpers.py
│   └── requirements.txt          # ⬅️ ÚNICO requirements.txt aqui
│
└── README.md