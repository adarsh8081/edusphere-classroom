## Packages
date-fns | Formatting dates for posts, assignments, and attendance
react-hook-form | Managing form state for complex forms (assignments, posts)
@hookform/resolvers | Validating forms with Zod

## Notes
- The application uses UUIDs (strings) for all primary keys (users, classes, etc.)
- Authentication requires cookies/session (credentials: 'include' used in all fetch requests)
- Wouter is used for routing, Link components should not wrap anchor tags.
