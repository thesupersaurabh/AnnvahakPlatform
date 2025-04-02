# Annvahak Platform

A comprehensive platform consisting of an Admin dashboard and a Buyer mobile application.

## Project Structure

- `Admin/` - Next.js based admin dashboard
- `buyer-app/` - React Native/Expo based mobile application
- `backend.py` - Python backend server

## Setup Instructions

### Admin Dashboard

1. Navigate to the Admin directory:
```bash
cd Admin
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file with required environment variables (see `.env.example`)

4. Run the development server:
```bash
pnpm dev
```

### Buyer App

1. Navigate to the buyer-app directory:
```bash
cd buyer-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with required environment variables

4. Start the Expo development server:
```bash
npx expo start
```

### Backend

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the backend server:
```bash
python backend.py
```

## Environment Variables

Make sure to set up the following environment variables:

### Admin Dashboard
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Buyer App
- `API_URL`: Backend API URL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 