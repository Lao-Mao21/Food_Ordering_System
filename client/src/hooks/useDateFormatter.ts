type Input = string | Date;

const parse = (value: Input): Date | null => {
    const d = typeof value === "string" ? new Date(value) : value;
    return isNaN(d.getTime()) ? null : d;
};

export const useDateFormatter = (locale: string = "en-PH") => {

    const base = (value: Input, options: Intl.DateTimeFormatOptions) => {
        const date = parse(value);
        if (!date) return "Invalid Date";

        return new Intl.DateTimeFormat(locale, options).format(date);
    };

    return {
        // May 1, 2026
        date: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "long",
                day: "numeric"
            }),

        // 03:45 PM
        time: (value: Input) =>
            base(value, {
                hour: "2-digit",
                minute: "2-digit"
            }),

        // May 1, 2026, 03:45 PM
        dateTime: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }),

        // May 01, 2026 (for tables)
        compact: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "short",
                day: "2-digit"
            }),

        // Fully custom (only when needed)
        custom: (value: Input, options: Intl.DateTimeFormatOptions) =>
            base(value, options)
    };
};

/* EXAMPLE USAGE
const dateFormat = useDateFormatter();

<p>{dateFormat.date(user.created_at)}</p>
<p>{dateFormat.time(user.created_at)}</p>
<p>{dateFormat.dateTime(user.created_at)}</p>
<p>{dateFormat.compact(user.created_at)}</p>
*/