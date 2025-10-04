egobrain-dev/
├── index.html                     # Página inicial usada no deploy atual (landing principal)
├── assets/                        # Diretório atual (mantido para compatibilidade)
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   └── utils/helpers.js
│   └── images/logo.jpeg
│
├── frontend/                      # Novo frontend modular (expansão futura)
│   ├── pages/                     # Páginas independentes (SPA ou multipage)
│   │   ├── loja.html              # Loja e produtos
│   │   ├── servicos.html          # Serviços
│   │   ├── sobre.html             # Sobre
│   │   ├── contato.html           # Contato
│   │   ├── login.html             # Login / Registro
│   │   ├── perfil.html            # Perfil do usuário
│   │   ├── revendedores.html      # Área de revendedores
│   │   └── admin.html             # Painel administrativo
│   │
│   ├── components/                # Reutilizáveis (header/footer/nav)
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── navbar.html
│   │   └── modals.html
│   │
│   ├── assets/                    # Nova estrutura visual para as novas páginas
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   ├── dashboard.css
│   │   │   └── loja.css
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── cart.js
│   │   │   ├── dashboard.js
│   │   │   ├── auth.js
│   │   │   └── utils/
│   │   │       └── helpers.js
│   │   └── images/
│   │       └── logo.jpeg
│
├── backend/                       # Backend Flask (API + lógica)
│   ├── app.py                     # App principal
│   ├── models.py                  # Modelos ORM
│   ├── routes/                    # Rotas separadas
│   │   ├── auth.py                # Login / Registro
│   │   ├── products.py            # CRUD Produtos
│   │   ├── licenses.py            # Licenças
│   │   ├── orders.py              # Pedidos
│   │   ├── users.py               # Perfis e Revendedores
│   │   └── admin.py               # Dashboard Admin
│   ├── utils/
│   │   ├── database.py            # Conexão SQLite
│   │   └── helpers.py             # Funções auxiliares
│   └── requirements.txt           # Dependências Flask
│
├── vercel.json                    # Configuração da Vercel
├── README.md
└── .gitignore