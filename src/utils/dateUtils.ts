export const timeAgo = (dateInput: string | Date): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `hace ${interval} año${interval === 1 ? '' : 's'}`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `hace ${interval} mes${interval === 1 ? '' : 'es'}`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `hace ${interval} día${interval === 1 ? '' : 's'}`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `hace ${interval} hora${interval === 1 ? '' : 's'}`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `hace ${interval} minuto${interval === 1 ? '' : 's'}`;

    return 'hace unos segundos';
};