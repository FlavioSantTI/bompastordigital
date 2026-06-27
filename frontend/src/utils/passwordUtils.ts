/**
 * Utilitário de validação de senha forte
 * Requisito: Mínimo 10 caracteres, com letras, números e caractere especial.
 */
export function validateStrongPassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 10) {
        return { isValid: false, message: 'A senha deve ter no mínimo 10 caracteres.' };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!hasLetter) {
        return { isValid: false, message: 'A senha deve conter pelo menos uma letra.' };
    }

    if (!hasNumber) {
        return { isValid: false, message: 'A senha deve conter pelo menos um número.' };
    }

    if (!hasSpecial) {
        return { isValid: false, message: 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, !).' };
    }

    return { isValid: true };
}
