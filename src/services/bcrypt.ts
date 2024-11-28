import { compareSync, hashSync } from "bcrypt";

function HashPassword(password: string): string {
    return hashSync(password, 10);
}

function HashPasswordCompare(hash: string, password: string): boolean {
    return compareSync(password, hash);
}

export { HashPassword, HashPasswordCompare };