import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        // 1. Get Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check for Bearer token
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        // 5. Attach authenticated user to request
        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        // 6. Allow request to continue
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
};