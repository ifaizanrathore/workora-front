# Workora Frontend

A modern task management frontend built with Next.js 14, TypeScript, and Tailwind CSS. Integrates with ClickUp API via a NestJS backend.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
workora-frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth routes (login)
│   │   └── login/page.tsx        # ClickUp OAuth login
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── home/page.tsx         # Main task list view
│   │   ├── settings/page.tsx     # User settings
│   │   └── layout.tsx            # Dashboard layout with auth guard
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect
│
├── components/
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Header.tsx            # Top header with search
│   │   └── Layout.tsx            # Main layout wrapper
│   │
│   ├── tasks/                    # Task components
│   │   ├── TaskList.tsx          # Task list with grouping
│   │   ├── TaskRow.tsx           # Individual task row
│   │   ├── TaskDetailModal.tsx   # Full task detail modal
│   │   ├── CreateTaskModal.tsx   # Create new task modal
│   │   └── CountdownTimer.tsx    # ETA countdown display
│   │
│   ├── panels/                   # Right-side panels
│   │   ├── ActivityPanel.tsx     # Task activity timeline
│   │   ├── DiscussionPanel.tsx   # Chat-style discussion
│   │   ├── CommentsPanel.tsx     # Comments with resolve
│   │   ├── ETAPanel.tsx          # Accountability/ETA tracker
│   │   ├── TagsPanel.tsx         # Tag management
│   │   └── LinksPanel.tsx        # Links & attachments
│   │
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── checkbox.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── progress.tsx
│   │   └── collapsible.tsx
│   │
│   └── Providers.tsx             # React Query + Toast provider
│
├── lib/
│   ├── api.ts                    # API client with all endpoints
│   └── utils.ts                  # Utility functions
│
├── hooks/
│   ├── useApi.ts                 # React Query hooks for API
│   └── index.ts                  # Custom hooks (countdown, etc.)
│
├── stores/
│   └── index.ts                  # Zustand stores (auth, workspace, tasks, UI)
│
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 🎨 Design System

### Colors
```css
Primary:      #6E62E5 (Purple)
Background:   #F5F7FB (Light gray)
Card:         #FFFFFF (White)
Border:       #DFE1E5 (Gray)

Priorities:
- Urgent:     #FF4D4D (Red)
- High:       #F59E0B (Amber)
- Normal:     #3B82F6 (Blue)
- Low:        #22C55E (Green)

Accountability Status:
- GREEN:      0 strikes
- ORANGE:     1-2 strikes
- RED:        3+ strikes
```

### Typography
- Font: Segoe UI / Inter
- Body: 14px
- Small: 12-13px
- Headings: 16-24px

## 🔌 API Endpoints

The frontend communicates with the NestJS backend at `http://localhost:3001/api/1`:

### Authentication
- `GET /clickup/auth/url` - Get OAuth URL
- `GET /auth/profile` - Get current user

### Workspaces
- `GET /clickup/workspaces` - List workspaces
- `GET /clickup/workspaces/:teamId/spaces` - List spaces

### Tasks
- `GET /tasks?listId=xxx` - Get tasks in list
- `GET /tasks/:taskId` - Get task details
- `POST /tasks` - Create task
- `PATCH /tasks/:taskId` - Update task
- `DELETE /tasks/:taskId` - Delete task

### Comments
- `GET /tasks/:taskId/comments` - Get comments
- `POST /tasks/:taskId/comments` - Add comment
- `PATCH /tasks/comments/:commentId` - Update comment

### Accountability
- `GET /accountability/task/:taskId` - Get accountability status
- `POST /accountability/task/:taskId/eta` - Set ETA
- `POST /accountability/task/:taskId/extend` - Extend ETA
- `POST /accountability/task/:taskId/complete` - Mark complete

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/1
```

### ngrok Support
All API requests include the header:
```
ngrok-skip-browser-warning: true
```

## 📦 Key Dependencies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@tanstack/react-query** - Data fetching & caching
- **Zustand** - State management
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **react-hot-toast** - Notifications
- **socket.io-client** - Real-time updates

##  Features

### Task Management
- ✅ Task list with status grouping
- ✅ Task detail modal with all fields
- ✅ Create/update/delete tasks
- ✅ Subtasks and checklists
- ✅ Tags and custom fields
- ✅ File attachments

### Accountability System
- ✅ ETA setting and tracking
- ✅ Real-time countdown timer
- ✅ Strike-based postponement
- ✅ GREEN/ORANGE/RED status
- ✅ Extension history

### Panels
- ✅ Activity timeline
- ✅ Discussion (chat-style)
- ✅ Comments with resolve
- ✅ ETA/Accountability
- ✅ Tags
- ✅ Links & Docs

### Navigation
- ✅ Sidebar with workspaces/spaces/folders/lists
- ✅ Search bar with keyboard shortcut
- ✅ User menu with settings

### Settings
- ✅ Profile management
- ✅ Notifications preferences
- ✅ Appearance (theme)
- ✅ Integrations (ClickUp)
- ✅ Accountability settings
- ✅ Privacy & Security

## 🔄 State Management

### Stores (Zustand)
- **useAuthStore** - User authentication
- **useWorkspaceStore** - Workspaces, spaces, lists
- **useTaskStore** - Tasks, filters, modals
- **useUIStore** - Sidebar, panels, theme
- **useTimerStore** - Active timer state

### Data Fetching (React Query)
All API calls use React Query with:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure
4. Start the backend server on port 3001
5. Run `npm run dev`
6. Open `http://localhost:3000`

## 📝 Notes

- The app requires the NestJS backend to be running
- ClickUp OAuth is required for authentication
- Some features have mock data for UI development
- WebSocket support is prepared for real-time updates

---
