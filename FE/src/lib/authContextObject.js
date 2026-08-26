import { createContext } from "react";

/**
 * Lives in its own module so AuthContext.jsx only exports a component —
 * mixing components and non-components in one file breaks Fast Refresh.
 */
export const AuthContext = createContext(null);
