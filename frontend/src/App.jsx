import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Documents from "./pages/Documents";
import DocumentEditor from "./pages/DocumentEditor";

import { getToken } from "./services/userService";


const ProtectedRoute = ({
    children
}) => {
    const token = getToken();

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
};


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                {/* REGISTER */}

                <Route
                    path="/register"
                    element={
                        <Register />
                    }
                />


                {/* DOCUMENT LIST */}

                <Route
                    path="/documents"
                    element={
                        <ProtectedRoute>
                            <Documents />
                        </ProtectedRoute>
                    }
                />


                {/* DOCUMENT EDITOR */}

                <Route
                    path="/doc/:id"
                    element={
                        <ProtectedRoute>
                            <DocumentEditor />
                        </ProtectedRoute>
                    }
                />


                {/* DEFAULT */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/documents"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;