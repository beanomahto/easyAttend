import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "../components/layouts/AdminLayout";

// Page Components
import LoginPage from "../pages/Auth/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import SubjectListPage from "../pages/Subjects/SubjectListPage";
import SubjectCreatePage from "../pages/Subjects/SubjectCreatePage";
import LocationListPage from "../pages/Locations/LocationListPage";
import LocationCreatePage from "../pages/Locations/LocationCreatePage";
import TimetableListPage from "../pages/Timetables/TimetableListPage";
import TimetableUpsertPage from "../pages/Timetables/TimetableUpsertPage"; // Using Upsert page directly
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProfessorListPage from "../pages/Professors/ProfessorListPage";
import ProfessorCreatePage from "../pages/Professors/ProfessorCreatePage";

import StudentListPage from "../pages/Students/StudentListPage";

// Route Protection
import ProtectedRoute from "../components/layouts/ProtectedRoute";
import useAuth from "../hooks/useAuth";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth(); // Use auth state to manage initial redirect

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Redirect root path based on authentication */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          {" "}
          {/* Apply layout to all admin pages */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subjects" element={<SubjectListPage />} />
          <Route path="/subjects/create" element={<SubjectCreatePage />} />
          {/* Add subject edit route later */}
          <Route path="/locations" element={<LocationListPage />} />
          <Route path="/locations/create" element={<LocationCreatePage />} />
          {/* Add location edit route later */}
          {/* For Timetables, going directly to Upsert/Manage might be practical */}
          <Route path="/timetables" element={<TimetableListPage />} />
          <Route path="/timetables/create" element={<TimetableUpsertPage />} />
          <Route path="/timetables/edit" element={<TimetableUpsertPage />} />
          {/* Optionally add a Timetable List page later if needed */}
          {/* <Route path="/timetables/list" element={<TimetableListPage />} /> */}
          <Route path="/professors" element={<ProfessorListPage />} />
          <Route path="/professors/create" element={<ProfessorCreatePage />} />
          {/* Add other admin routes here (User Management, etc.) */}
          <Route path="/students" element={<StudentListPage />} />
        </Route>{" "}
        {/* End AdminLayout */}
      </Route>{" "}
      {/* End ProtectedRoute */}
      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;