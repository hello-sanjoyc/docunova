export type AppRole = "SUPERADMIN" | "ADMIN" | "MEMBER";

export const APP_ROLES: AppRole[] = ["SUPERADMIN", "ADMIN", "MEMBER"];

export function toAppRole(roleCode: string | null | undefined): AppRole {
    const normalized = roleCode?.trim().toLowerCase();

    if (normalized === "superadmin" || normalized === "super_admin") {
        return "SUPERADMIN";
    }
    if (normalized === "admin" || normalized === "owner") {
        return "ADMIN";
    }

    return "MEMBER";
}

export function toRoleCode(role: AppRole): "superadmin" | "admin" | "member" {
    return role.toLowerCase() as "superadmin" | "admin" | "member";
}

export function toRoleName(role: AppRole) {
    if (role === "SUPERADMIN") return "Super Admin";
    return role.charAt(0) + role.slice(1).toLowerCase();
}
