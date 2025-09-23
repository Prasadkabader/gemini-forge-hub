# AI-Powered Project Management Platform

A modern project management platform built with React, TypeScript, and Supabase, featuring AI-powered chat assistance and file processing capabilities.

## 🚀 Features

### Core Features
- **Project Management**: Create, organize, and manage multiple projects
- **AI Chat Assistant**: Powered by Google Gemini AI for intelligent project assistance
- **File Upload & Processing**: Support for TXT, CSV, and PDF files with intelligent text extraction
- **Prompt Management**: Create, save, and reuse prompts for consistent AI interactions
- **User Authentication**: Secure authentication system with Supabase Auth
- **Real-time Updates**: Live data synchronization across all project components

### Technical Features
- **Responsive Design**: Beautiful, mobile-first design using Tailwind CSS
- **Type Safety**: Full TypeScript implementation for robust code
- **Component Library**: Custom UI components built with Radix UI primitives
- **Edge Functions**: Serverless backend processing with Supabase Edge Functions
- **Row Level Security**: Secure data access with Supabase RLS policies
- **File Processing**: Advanced PDF text extraction and content analysis

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript with excellent developer experience
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Headless UI components for accessibility and customization
- **React Router** - Client-side routing with modern features
- **React Hook Form** - Performant forms with easy validation
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Authentication and user management
- **Supabase Edge Functions** - Serverless functions for backend logic
- **Row Level Security** - Database-level security policies
- **Real-time Subscriptions** - Live data updates

### AI & Processing
- **Google Gemini AI** - Advanced language model for chat assistance
- **Custom PDF Parser** - Text extraction from PDF documents
- **File Processing Pipeline** - Automated content analysis and preview generation

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Google Gemini API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   ```

4. **Supabase Setup**
   - Create a new Supabase project
   - Run the database migrations (located in `supabase/migrations/`)
   - Set up the Edge Functions:
     ```bash
     supabase functions deploy file-upload
     supabase functions deploy chat
     ```
   - Add the following secrets to your Supabase project:
     - `GEMINI_API_KEY`: Your Google Gemini API key

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── FileUpload.tsx  # File upload component
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── Auth.tsx        # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Project.tsx     # Project detail page
│   └── Index.tsx       # Landing page
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── use-toast.ts    # Toast notification hook
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
└── styles/             # Global styles and Tailwind config

supabase/
├── functions/          # Edge Functions
│   ├── file-upload/    # File processing function
│   └── chat/           # AI chat function
└── migrations/         # Database schema migrations
```

## 🗄️ Database Schema

### Tables
- **profiles**: User profile information
- **projects**: Project metadata and settings
- **prompts**: Saved prompts for AI interactions
- **chats**: Chat messages and conversation history
- **files**: Uploaded file metadata and processed content

### Security
All tables implement Row Level Security (RLS) policies to ensure users can only access their own data.

## 🔧 Development

### Available Scripts
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Style
- ESLint configuration for code quality
- TypeScript strict mode enabled
- Prettier for consistent formatting
- Conventional commits recommended

## 🚀 Deployment

### Supabase Edge Functions
The project includes two Edge Functions that need to be deployed:

1. **file-upload**: Handles file processing and text extraction
2. **chat**: Manages AI chat interactions with Gemini API

Deploy functions using the Supabase CLI:
```bash
supabase functions deploy --no-verify-jwt file-upload
supabase functions deploy chat
```

### Frontend Deployment
The React application can be deployed to any static hosting service:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Supabase Hosting

Build the application:
```bash
npm run build
```

The `dist` folder will contain the production-ready files.

## 🔑 Environment Variables

### Client Environment Variables
```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Supabase Secrets (Edge Functions)
Configure these in your Supabase dashboard under Settings > Edge Functions:
- `GEMINI_API_KEY`: Google Gemini API key for AI chat functionality
- `SUPABASE_URL`: Automatically provided
- `SUPABASE_ANON_KEY`: Automatically provided

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [React documentation](https://reactjs.org/docs)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI language model

---

Built with ❤️ using modern web technologies
