# Annvahak Platform

## About
Annvahak Platform is a system-level, scalable direct market access platform that connects farmers directly with buyers, eliminating intermediaries and ensuring fair trade. This B.Tech final year project is inspired by a Smart India Hackathon problem statement, focused on empowering farmers through technology.

> **Note:** If you're interested in a live demonstration or deployment of this project, please reach out to the project maintainer who can assist in making it live.

> **GitHub Repository:** [https://github.com/thesupersaurabh/AnnvahakPlatform](https://github.com/thesupersaurabh/AnnvahakPlatform)

## 💼 Collaboration Opportunity
This project has the potential to transition from a college project to a real-world solution. If you're interested in collaborating to bring this platform to market or implementing it for your organization, please reach out on LinkedIn: [thesupersaurabh](https://www.linkedin.com/in/thesupersaurabh/).

## 🌟 Key Features

- **Direct Farmer-Buyer Connection**: Eliminates middlemen for better prices
- **System-Level Architecture**: Built for scalability and maintainability
- **Self-Hosted Solution**: No dependency on third-party services
- **Multi-Platform Access**: Web admin panel and native mobile apps
- **Offline Functionality**: Mobile apps work without continuous internet access
- **Real-Time Chat**: Direct communication between farmers and buyers
- **Comprehensive Order Management**: End-to-end tracking
- **Role-Based Access**: Separate interfaces for farmers, buyers, and administrators

## 📱 Platform Components

### 1. Flask API Backend (`backend.py`)
- Single-file API server built with Flask and PostgreSQL
- JWT-based authentication and role-based access control
- Handles products, orders, chat messaging, and user management
- Optimized for performance and security

### 2. Next.js Admin Panel (`/admin`)
- Modern dashboard built with Next.js and Tailwind CSS
- Platform management and monitoring capabilities
- User management, product approval, order tracking

### 3. React Native Buyer App (`/buyer`)
- Native mobile application for product browsing and purchasing
- Order placement and tracking
- Chat with farmers
- Offline functionality

### 4. React Native Farmer App (`/farmer`)
- Product listing and management
- Order fulfillment
- Chat with buyers
- Works offline with synchronization

## 🔧 Technologies

- **Backend**: Flask, PostgreSQL, JWT, Bcrypt, Gunicorn
- **Admin Panel**: Next.js, Tailwind CSS, ShadCN UI
- **Mobile Apps**: React Native, Expo, React Navigation
- **Authentication**: Custom JWT implementation (no third-party providers)
- **Deployment**: Docker, Vercel

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting to prevent abuse
- No third-party authentication providers
- Data encryption for sensitive information

## 🚀 Project Goals

- Create a scalable platform connecting farmers directly with buyers
- Provide modern, user-friendly interfaces for all user types
- Ensure system reliability with offline functionality
- Implement robust security measures
- Build a production-ready solution with high performance

## 🏗️ Development Approach

- System-level design principles for robust architecture
- Focus on performance optimization at every level
- Comprehensive security implementation
- Clean, maintainable code structure
- Thorough testing for production readiness

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 14+
- PostgreSQL
- React Native development environment

### Installation

1. Clone the repository:
```
git clone https://github.com/thesupersaurabh/AnnvahakPlatform.git
cd AnnvahakPlatform
```

2. Set up the backend:
```
pip install -r requirements.txt
python backend.py
```

3. Set up the admin panel:
```
cd admin
npm install
npm run dev
```

4. Set up the buyer app:
```
cd buyer
npm install
npx expo start
```

5. Set up the farmer app:
```
cd farmer
npm install
npx expo start
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Smart India Hackathon for the inspiration
- Faculty advisors for their guidance
- Open source libraries that made this project possible 
