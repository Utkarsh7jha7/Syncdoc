import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import NewDocument from "./pages/NewDocument";
import DocumentEditor from "./pages/DocumentEditor";
import Fab from "./components/Fab";

import { getToken } from "./services/userService";


const ProtectedRoute = ({ children }) => {
    const token = getToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};


function App() {
    return (
        <BrowserRouter>
            {/* Floating Action Button */}
            <Fab />
            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/new-doc"
                    element={
                        <ProtectedRoute>
                            <NewDocument />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/doc/:id"
                    element={
                        <ProtectedRoute>
                            <DocumentEditor />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/new-doc"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;