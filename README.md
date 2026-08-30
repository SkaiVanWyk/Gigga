# Gigga - Student Side-Jobs Platform

A modern platform connecting South African students with flexible side-job opportunities from local businesses.

## Features

### For Students
- **Browse Jobs**: Search and filter jobs by category, city, and type
- **Save Jobs**: Bookmark interesting opportunities for later
- **Apply Instantly**: One-click application with profile
- **Track Applications**: Monitor application status
- **Messages**: Communicate directly with businesses
- **Profile Management**: Showcase skills, experience, and CV

### For Businesses
- **Post Jobs**: Create detailed job listings
- **Manage Applications**: Review and respond to applicants
- **View Profiles**: Access student CVs and qualifications
- **Messages**: Communicate with potential hires
- **Job Analytics**: Track views and applications

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Backend**: Supabase (PostgreSQL database, Auth, Storage)
- **Styling**: Custom CSS with CSS variables for theming
- **Icons**: Emoji-based (lightweight, no external dependencies)

## Getting Started

### Prerequisites
- Node.js (for running a local server)
- Supabase account and project setup

### Installation

1. Clone the repository
2. Run the Supabase schema setup:
   - Open `supabase-schema.sql` in Supabase SQL Editor
   - Execute the SQL to create tables and policies
   - Run `supabase-schema-updates.sql` for additional features

3. Configure Supabase:
   - Update `supabase.js` with your Supabase URL and anon key
   - Set up Google OAuth in Supabase Auth settings
   - Configure storage buckets (avatars, cvs)

4. Run locally:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using VS Code Live Server extension
   # Right-click on index.html and select "Open with Live Server"
   ```

5. Open http://localhost:8000 in your browser

## File Structure

```
Gigga/
├── index.html              # Landing page
├── jobs.html               # Job browsing
├── saved-jobs.html         # Saved jobs (students)
├── messages.html           # Messaging system
├── profile.html            # User profile
├── post-job.html           # Job posting (businesses)
├── login.html              # Authentication
├── register-student.html   # Student registration
├── register-business.html  # Business registration
├── contact.html            # Contact form
├── faq.html                # FAQ page
├── about.html              # About page
├── privacy-policy.html     # Privacy policy
├── terms-of-service.html  # Terms of service
├── style.css               # Global styles
├── supabase.js             # Supabase client
├── supabase-schema.sql     # Database schema
├── supabase-schema-updates.sql  # Schema updates
├── landing.js              # Landing page logic
├── jobs.js                 # Jobs page logic
├── saved-jobs.js           # Saved jobs logic
├── messages.js             # Messaging logic
├── profile.js              # Profile logic
├── post-job.js             # Job posting logic
├── auth.js                 # Authentication logic
├── register-student.js     # Student registration logic
├── register-business.js    # Business registration logic
├── contact.js              # Contact form logic
├── faq.js                  # FAQ logic
├── about.js                # About page logic
├── privacy-policy.js       # Privacy policy logic
├── terms-of-service.js     # Terms logic
├── utils.js                # Utility functions
├── script.js               # Entry point
└── components/
    └── toast.js            # Toast notification system
```

## Database Schema

### Tables
- `profiles`: User profiles (students and businesses)
- `jobs`: Job postings
- `applications`: Job applications
- `saved_jobs`: Bookmarked jobs (students)
- `messages`: User-to-user messaging
- `notifications`: System notifications
- `contact_submissions`: Contact form submissions

### Storage Buckets
- `avatars`: User profile pictures (public)
- `cvs`: Student CVs (private)

## Features Implemented

### Core Features
- ✅ User authentication (email/password + Google OAuth)
- ✅ Role-based access (student/business)
- ✅ Job posting and browsing
- ✅ Job application system
- ✅ Profile management
- ✅ File uploads (avatars, CVs)
- ✅ Job saving/bookmarking
- ✅ Real-time messaging
- ✅ Contact form

### UI/UX Features
- ✅ Dark mode with system preference detection
- ✅ Toast notification system
- ✅ Loading states and skeletons
- ✅ Form validation
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Mobile-friendly navigation

### Content Pages
- ✅ FAQ with search functionality
- ✅ About page
- ✅ Contact page
- ✅ Privacy policy
- ✅ Terms of service

## Security

- Row Level Security (RLS) policies on all tables
- Secure file upload policies
- Password authentication with OAuth option
- Input validation and sanitization
- CSRF protection through Supabase

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Deployment

### Supabase Setup
1. Create a new project in Supabase
2. Run the SQL schema files
3. Configure authentication providers
4. Set up storage buckets
5. Update environment variables

### Hosting Options
- Netlify (recommended)
- Vercel
- GitHub Pages
- Any static hosting service

## Development

### Adding New Features
1. Update database schema if needed
2. Create HTML page
3. Add JavaScript logic
4. Style with CSS
5. Update navigation

### Code Style
- Use ES6+ JavaScript features
- Follow existing naming conventions
- Comment complex logic
- Keep functions focused and small

## Troubleshooting

### Common Issues

**File protocol warning**: The site requires a local server due to ES modules and CORS. Use Live Server or similar.

**Supabase connection errors**: Verify your Supabase URL and keys in `supabase.js`.

**Storage upload failures**: Check storage bucket policies and ensure buckets are created.

**OAuth not working**: Ensure redirect URLs are configured in Supabase Auth settings.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact support@gigga.co.za
