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
        date: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "long",
                day: "numeric"
            }),

        time: (value: Input) =>
            base(value, {
                hour: "2-digit",
                minute: "2-digit"
            }),

        dateTime: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }),

        compact: (value: Input) =>
            base(value, {
                year: "numeric",
                month: "short",
                day: "2-digit"
            }),

        custom: (value: Input, options: Intl.DateTimeFormatOptions) =>
            base(value, options)
    };
};
