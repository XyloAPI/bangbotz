const { env } = require("../../config/env");

function formatCategoryName(name) {
  return name.toUpperCase();
}

function normalizeCategoryCommand(name) {
  return `menu${name.toLowerCase().replace(/\s+/g, "")}`;
}

function groupCommandsByCategory(commands) {
  const grouped = new Map();

  for (const command of commands) {
    const category = command.category || "Other";

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }

    grouped.get(category).push(command);
  }

  return grouped;
}

function createMenuMessage(commands, context, mode) {
  const now = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date());

  const displayName = context.pushName || "Kak";
  const botName = env.BOT_NAME;
  const groupedCommands = groupCommandsByCategory(commands);
  const categoryNames = Array.from(groupedCommands.keys());

  const message = [
    `== ${botName} MENU ==`,
    `Hai ${displayName}`,
    "",
    `[ BOT INFO ]`,
    `- Nama     : ${env.BOT_NAME}`,
    `- Prefix   : ${env.BOT_PREFIXES.join(" ")}`,
    `- Owner    : ${env.OWNER_NAME}`,
    `- Waktu    : ${now}`,
    `- Kategori : ${categoryNames.length}`,
    `- Command  : ${commands.length}`,
    ""
  ];

  if (mode === "categories") {
    message.push(
      `[ KATEGORI ]`,
      ...categoryNames.map((category) => `• ${normalizeCategoryCommand(category)}`),
      "",
      `Ketik salah satu menu kategori di atas untuk melihat isinya.`,
      `Ketik allmenu untuk melihat semua command.`
    );

    return message;
  }

  if (typeof mode === "object" && mode.category) {
    const category = mode.category;
    const categoryCommands = groupedCommands.get(category) || [];

    message.push(`[ ${formatCategoryName(category)} ]`);

    for (const command of categoryCommands) {
      message.push(`• ${command.name}`);
    }

    return message;
  }

  message.push(`[ ALL MENU ]`);

  for (const [category, categoryCommands] of groupedCommands.entries()) {
    message.push("");
    message.push(`[ ${formatCategoryName(category)} ]`);

    for (const command of categoryCommands) {
      message.push(`• ${command.name}`);
    }
  }

  return message;
}

function createHelpCommands(commands) {
  const menuExecutor = async (_args, context, mode) => {
    const message = createMenuMessage(commands, context, mode);
    await context.reply(message.join("\n"));
  };

  const groupedCommands = groupCommandsByCategory(commands);
  const categoryMenuCommands = Array.from(groupedCommands.keys()).map((category) => ({
    name: normalizeCategoryCommand(category),
    description: `Menampilkan daftar command kategori ${category}.`,
    category: "Info",
    aliases: [],
    async execute(args, context) {
      await menuExecutor(args, context, { category });
    }
  }));

  return [
    {
      name: "help",
      description: "Menampilkan daftar kategori menu.",
      category: "Info",
      aliases: ["menu"],
      async execute(args, context) {
        await menuExecutor(args, context, "categories");
      }
    },
    ...categoryMenuCommands,
    {
      name: "allmenu",
      description: "Menampilkan semua command berdasarkan kategori.",
      category: "Info",
      aliases: [],
      async execute(args, context) {
        await menuExecutor(args, context, "all");
      }
    }
  ];
}

module.exports = { createHelpCommands };
