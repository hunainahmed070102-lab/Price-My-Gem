# PriceMyGem Web Admin Panel

React-based web admin panel for PriceMyGem system management.

## Features

- Admin authentication
- Dashboard with statistics and charts
- User management
- Reports viewing
- Price management (CRUD operations)
- Responsive Material Design UI

## Tech Stack

- React 18
- Vite (Build tool)
- Material-UI (MUI)
- React Router
- Axios
- Recharts (Charts)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Edit `src/utils/config.js` and update the API_BASE_URL if needed:

```javascript
export const API_BASE_URL = 'http://localhost:5000/api';
```

### 3. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### 5. Preview Production Build

```bash
npm run preview
```

## Default Admin Credentials

After backend initialization:
- Email: `admin@pricemygem.com`
- Password: `admin123`

## Project Structure

```
web-app/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── PricesPage.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── utils/           # Helper functions
│   │   ├── config.js
│   │   └── helpers.js
│   ├── App.jsx          # Root component
│   └── main.jsx         # Entry point
├── index.html
├── vite.config.js
├── package.json
└── README.md
```
## Pages

### 1. Login Page
- Admin authentication
- Form validation
- Error handling

### 2. Dashboard
- Total users count
- Total reports count
- Gemstone distribution pie chart
- Gemstone analysis summary

### 3. Users Page
- List all users
- View user details
- User role badges
- Registration dates

### 4. Reports Page
- List all analysis reports
- View report details
- Gemstone images
- Confidence scores
- Authenticity status
- Price ranges

### 5. Prices Page
- List all gemstone prices
- Edit price ranges
- Update min/max prices
- Currency display

## Features

### Authentication
- JWT-based authentication
- Protected routes
- Auto-redirect on token expiration
- Admin role verification

### Dashboard
- Real-time statistics
- Interactive pie chart
- Gemstone distribution
- Color-coded data

### Data Management
- CRUD operations for prices
- View-only for users and reports
- Table-based data display
- Responsive design

## API Integration

All API calls are centralized in `src/services/api.js`:

- `authService.login()` - Admin login
- `adminService.getUsers()` - Get all users
- `adminService.getReports()` - Get all reports
- `adminService.getStatistics()` - Get dashboard stats
- `adminService.getPrices()` - Get all prices
- `adminService.updatePrice()` - Update price

## Styling

The app uses Material-UI with a custom theme:
- Primary Color: #6200EE (Purple)
- Secondary Color: #03DAC6 (Teal)
- Responsive layout
- Material Design components

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Deploy to GitHub Pages

```bash
npm run build
# Configure GitHub Pages to serve from dist/
```

## Environment Variables

Create `.env` file for production:

```
VITE_API_URL=https://your-api-url.com/api
```

Update `src/utils/config.js`:

```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Troubleshooting

### Cannot connect to API
- Verify backend is running
- Check API_BASE_URL in config
- Check CORS settings in backend

### Login fails
- Verify admin credentials
- Check backend logs
- Ensure user has admin role

### Charts not displaying
- Check if data is being fetched
- Verify Recharts is installed
- Check browser console for errors

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading components
- Optimized production build
- Minified assets

## Security

- JWT token authentication
- Protected routes
- Admin role verification
- XSS protection
- CSRF protection

## Future Enhancements

- Real-time updates with WebSocket
- Export data to CSV/PDF
- Advanced filtering and search
- User activity logs
- Email notifications
- Multi-language support
