import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Основные страницы
import HomePage from "../pages/HomePage";
import Calculator from "../pages/Calculator";
import ManualCalculator from "../pages/ManualCalculator";
import Documentation from "../pages/Documentation";
import Settings from "../pages/Settings";

// Секции документации
import OxygenSection from "../components/documentation/sections/OxygenSection";
import N2OSection from "../components/documentation/sections/N2OSection";
import CO2Section from "../components/documentation/sections/CO2Section";
import Air5Section from "../components/documentation/sections/Air5Section";
import Air8Section from "../components/documentation/sections/Air8Section";
import AGSSSection from "../components/documentation/sections/AGSSSection";
import VacuumSection from "../components/documentation/sections/VacuumSection";
import NavigationSection from "../components/documentation/sections/NavigationSection";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Главные страницы */}
      <Route path="/" element={<HomePage />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/calculator-manual" element={<ManualCalculator />} />
      <Route path="/settings" element={<Settings />} />

      {/* Документация и её внутренние страницы */}
      <Route path="/docs" element={<Documentation />}>
        {/* редирект на Кислород по умолчанию */}
        <Route index element={<Navigate to="navigation" replace />} />
        <Route path="navigation" element={<NavigationSection />} />
        <Route path="oxygen" element={<OxygenSection />} />
        <Route path="n2o" element={<N2OSection />} />
        <Route path="co2" element={<CO2Section />} />
        <Route path="air5" element={<Air5Section />} />
        <Route path="air8" element={<Air8Section />} />
        <Route path="agss" element={<AGSSSection />} />
        <Route path="vacuum" element={<VacuumSection />} />
      </Route>
    </Routes>
  );
}
