# Reminiscape

> A geospatial memory journaling application that allows users to attach personal memories to real-world locations through an interactive map interface.

Reminiscape is a full-stack web application built with **Next.js (App Router)** and **TypeScript**, integrating **Mapbox** for geospatial visualization and **Supabase** for authentication, database, and storage.

---

## 🌍 Overview

Reminiscape enables users to:

- Create memories pinned to geographic coordinates
- Attach metadata and media to each memory
- Visualize memories interactively on a dynamic map
- Persist and sync data using a real-time backend

This project focuses on production-level frontend architecture, strict type safety, and maintainable development workflows suitable for collaborative environments.

---

## ✨ Core Features

- 📍 Create location-based memories
- 🗺️ Interactive map powered by Mapbox
- 🔐 Supabase authentication
- 📝 Structured memory data (title, description, date, coordinates)
- 🖼️ Media upload support
- 📏 Distance calculations using geolib
- 🎞️ UI animations with Framer Motion
- 🚀 Production deployment via Vercel

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15 (App Router)**
- **React 18**
- **TypeScript (Strict Mode)**
- **TailwindCSS**
- **Framer Motion**

### Geospatial

- **mapbox-gl**
- **react-map-gl**
- **geolib**

### Backend / Infrastructure

- **Supabase (Auth + Postgres + Storage)**
- **Vercel Deployment**

---

## 🏗 Architecture Overview

### Project Structure Philosophy

The project follows a modular, feature-oriented structure to separate:

- UI components
- Business logic
- Data access
- Type definitions

This separation improves:

- Maintainability
- Scalability
- Team collaboration readiness
- Predictable data flow

---

### State Management Strategy

- Local state for isolated UI concerns
- Lifted/shared state for map-memory coordination
- Strict TypeScript interfaces for domain models
- Controlled side effects using React hooks

Design goal: predictable state transitions and minimized unnecessary re-renders.

---

### Data Flow

1. User creates memory
2. Client-side validation occurs
3. Supabase insert executes (Postgres + Storage)
4. Local state refetches from Supabase
5. Map re-renders with updated markers

This ensures UI consistency with backend state.

---

## 🔒 Type Safety & Code Quality

This project emphasizes production-ready development discipline.

### Type Safety

- Strict TypeScript configuration
- No uncontrolled `any`
- Clearly defined domain models

### Linting & Formatting

- ESLint (Next.js + TypeScript rules)
- Prettier (with Tailwind plugin)
- Unused import enforcement

### Git Workflow

- Husky pre-commit hooks
- Commitlint (Conventional Commits)
- lint-staged validation

Purpose:
Maintain readable commit history, consistent code style, and scalable collaboration.

---

## 📈 Scalability Considerations

If scaling beyond prototype stage:

- Add pagination for memory fetching
- Introduce server-side validation layer
- Optimize marker rendering for large datasets
- Add caching strategy for frequently accessed clusters
- Consider a backend abstraction layer if needed

---

## ⚙️ Local Development

```bash
git clone https://github.com/jasmix555/reminiscape
cd reminiscape
npm install
npm run dev
```
