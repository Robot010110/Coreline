import { useState } from "react";
import RoleSelectScreen from "../components/auth/RoleSelectScreen";
import EmployeeLoginScreen from "../components/auth/EmployeeLoginScreen";
import StaffLoginScreen from "../components/auth/StaffLoginScreen";
import OpenAccessScreen from "../components/auth/OpenAccessScreen";

// LoginPage.jsx — Who's logging in? -> one of three Stage-2 screens:
//   Employee (Worker / Cashier) -> EmployeeLoginScreen: code/username + password
//   Admin                       -> StaffLoginScreen:    username + password
//   Supervisor / Regional (Zone) Manager -> OpenAccessScreen: no form at
//       all — tapping the role signs straight in (see OpenAccessScreen.jsx
//       and backend/src/utils/openAccess.js).
const STAGE_ROLE = "role";
const STAGE_EMPLOYEE = "employee";
const STAGE_ADMIN = "admin";
const STAGE_OPEN = "open";

export default function LoginPage({ onLogin }) {
  const [stage, setStage] = useState(STAGE_ROLE);
  const [openRoleKey, setOpenRoleKey] = useState("supervisor");

  function handleRoleSelect(key) {
    if (key === "employee") {
      setStage(STAGE_EMPLOYEE);
    } else if (key === "admin") {
      setStage(STAGE_ADMIN);
    } else {
      setOpenRoleKey(key); // supervisor | regionalManager
      setStage(STAGE_OPEN);
    }
  }

  const backToRoles = () => setStage(STAGE_ROLE);

  if (stage === STAGE_EMPLOYEE) {
    return <EmployeeLoginScreen onBack={backToRoles} onLogin={onLogin} />;
  }

  if (stage === STAGE_ADMIN) {
    return <StaffLoginScreen onBack={backToRoles} onLogin={onLogin} />;
  }

  if (stage === STAGE_OPEN) {
    return <OpenAccessScreen roleKey={openRoleKey} onBack={backToRoles} onLogin={onLogin} />;
  }

  return <RoleSelectScreen onSelect={handleRoleSelect} />;
}
