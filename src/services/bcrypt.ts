import { compareSync, hashSync } from "bcrypt-ts";

function HashPassword(password: string): string {
    return hashSync(password);
}

function HashPasswordCompare(hash: string, password: string): boolean {
    return compareSync(password, hash);
}

module.exports = { HashPassword, HashPasswordCompare };