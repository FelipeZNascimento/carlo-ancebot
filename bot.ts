import { Bot } from "grammy";
import ApiService from "./services/api_request.js";
import type { IMatch } from "./match.types.js";
import { EDITION_START } from "./match.constants.js";
import type { IRankingResponse } from "./ranking.types.js";

// Create an instance of the `Bot` class and pass your bot token to it.
const botToken = process.env["BOT_TOKEN"];
if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

const bot = new Bot(botToken);
const siteLink = "\n\n🔗 [Bolão Copa](https://bolaocopa.omegafox.me/)";
const apiRequest = new ApiService();
const hpbrIds = [9, 17, 22, 25, 26, 28, 29, 30, 63, 82, 199, 200, 201, 238];
const mbioIds = [9, 29, 196, 203, 204, 256, 261, 275];

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx: any) => ctx.reply("Welcome! Up and running."));
// Handle other messages.
bot.command("proximas", async (ctx: any) => {
  try {
    const response = await apiRequest.get<IMatch[]>(`match/next-matches`);
    if (response.length === 0) {
      await ctx.reply("Não há próximas partidas disponíveis.");
      return;
    }

    const lines = response.map((match) => {
      const date = new Date(Number(match.timestamp) * 1000);
      const dateStr = date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `🏟 ${match.homeTeam.name} x ${match.awayTeam.name}\n📅 ${dateStr}\n📍 ${match.stadium.name}, ${match.stadium.city} (Grupo ${match.group})`;
    });

    await ctx.reply(lines.join("\n\n") + "\n\n🔗 [Bolão Copa](https://bolaocopa.omegafox.me/)", {
      parse_mode: "Markdown",
    });
  } catch (error: unknown) {
    console.error("Error fetching next matches:", error);
    await ctx.reply(
      "Ocorreu um erro ao buscar as próximas partidas. Por favor, tente novamente mais tarde." + siteLink,
      { parse_mode: "Markdown" },
    );
    return;
  }
});

bot.command("jacomecou", async (ctx: any) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = EDITION_START - now;

  if (diff <= 0) {
    await ctx.reply("⚽ A Copa já começou!" + siteLink, {
      parse_mode: "Markdown",
    });
    return;
  }

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  await ctx.reply(`⏳ Ainda não! Faltam *${days}d ${hours}h ${minutes}m ${seconds}s* pra Copa começar!` + siteLink, {
    parse_mode: "Markdown",
  });
});

bot.command("live", async (ctx: any) => {
  try {
    const response = await apiRequest.get<IMatch[]>(`match/live-matches`);
    if (response.length === 0) {
      await ctx.reply("Não há partidas em andamento" + siteLink, {
        parse_mode: "Markdown",
      });
      return;
    }

    const lines = response.map((match) => {
      const date = new Date(Number(match.timestamp) * 1000);
      const dateStr = date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `🏟 ${match.homeTeam.name} ${match.score.home} x ${match.score.away} ${match.awayTeam.name}\n📅 ${dateStr}\n📍 ${match.stadium.name}, ${match.stadium.city} (Grupo ${match.group})`;
    });

    await ctx.reply(lines.join("\n\n") + siteLink, {
      parse_mode: "Markdown",
    });
  } catch (error: unknown) {
    console.error("Error fetching live matches:", error);
    await ctx.reply(
      "Ocorreu um erro ao buscar as partidas em andamento. Por favor, tente novamente mais tarde." + siteLink,
      {
        parse_mode: "Markdown",
      },
    );
    return;
  }
});

bot.command("rankingmbio", async (ctx: any) => {
  const arg = ctx.match.trim();
  const roundNumber = arg ? parseInt(arg, 10) : null;

  if (arg && (isNaN(roundNumber!) || roundNumber! <= 0)) {
    await ctx.reply("O argumento deve ser um número de rodada válido. Ex: /rankingmbio 1", { parse_mode: "Markdown" });
    return;
  }

  try {
    const parsedRanking = await parseRanking(roundNumber, "MBIO", mbioIds);
    await ctx.reply(parsedRanking, { parse_mode: "Markdown" });
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar o ranking. Por favor, tente novamente mais tarde.");
    return;
  }
});

bot.command("rankinghpbr", async (ctx: any) => {
  const arg = ctx.match.trim();
  const roundNumber = arg ? parseInt(arg, 10) : null;

  if (arg && (isNaN(roundNumber!) || roundNumber! <= 0)) {
    await ctx.reply("O argumento deve ser um número de rodada válido. Ex: /rankinghpbr 1", { parse_mode: "Markdown" });
    return;
  }

  try {
    const parsedRanking = await parseRanking(roundNumber, "HPBR", hpbrIds);
    await ctx.reply(parsedRanking, { parse_mode: "Markdown" });
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar o ranking. Por favor, tente novamente mais tarde.");
    return;
  }
});

bot.command("apostashpbr", async (ctx: any) => {
  try {
    const response = await parseBets(hpbrIds);
    await ctx.reply(response);
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar live matches. Por favor, tente novamente mais tarde." + siteLink, {
      parse_mode: "Markdown",
    });
    return;
  }
});

bot.command("apostasmbio", async (ctx: any) => {
  try {
    const response = await parseBets(mbioIds);
    await ctx.reply(response);
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar live matches. Por favor, tente novamente mais tarde.");
    return;
  }
});

bot.command("rankingtop10", async (ctx: any) => {
  const arg = ctx.match.trim();
  const roundNumber = arg ? parseInt(arg, 10) : null;

  if (arg && (isNaN(roundNumber!) || roundNumber! <= 0)) {
    await ctx.reply("O argumento deve ser um número de rodada válido. Ex: /rankingtop10 1", { parse_mode: "Markdown" });
    return;
  }

  try {
    const response = await apiRequest.get<IRankingResponse>(`ranking/edition`);

    let ranking;
    let title;

    if (roundNumber !== null) {
      const roundData = response.round.find((r) => r.round === roundNumber);
      if (!roundData) {
        await ctx.reply(`Rodada *${roundNumber}* não encontrada.` + siteLink, { parse_mode: "Markdown" });
        return;
      }
      ranking = roundData.ranking;
      title = `🏆 *Top 10 — Rodada ${roundNumber}*`;
    } else {
      ranking = response.edition;
      title = `🏆 *Top 10 — Geral*`;
    }

    if (ranking.length === 0) {
      await ctx.reply("Não há dados de ranking disponíveis" + siteLink, { parse_mode: "Markdown" });
      return;
    }

    const lines = ranking.slice(0, 10).map((line) => {
      const { position, positionVariation, points, exacts } = line.accumulatedScore;
      const name = line.user.nickname ?? line.user.name;
      const trend = positionVariation > 0 ? "🔼" : positionVariation < 0 ? "🔽" : "➡️";
      return `${position}. ${trend} *${name}* — ${points}pts _(${exacts} exatos)_`;
    });

    await ctx.reply(`${title}\n\n${lines.join("\n")}` + siteLink, { parse_mode: "Markdown" });
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar o ranking. Por favor, tente novamente mais tarde." + siteLink, {
      parse_mode: "Markdown",
    });
    return;
  }
});

async function parseBets(ids: number[]) {
  const response = await apiRequest.get<IMatch[]>(`match/live-matches`);
  if (response.length === 0) {
    return "Não há partidas em andamento";
  }
  const lines = response.map((match) => {
    const date = new Date(Number(match.timestamp) * 1000);
    const dateStr = date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const title = `🏟 ${match.homeTeam.name} ${match.score.home} x ${match.score.away} ${match.awayTeam.name}\n📅 ${dateStr}\n📍 ${match.stadium.name}, ${match.stadium.city} (Grupo ${match.group})\n\n`;

    const matchBets = match.bets
      .filter((b) => ids.includes(b.user.id))
      .sort((a, b) => a.user.nickname.localeCompare(b.user.nickname))
      .map((line) => {
        const { user, scoreHome, scoreAway } = line;
        return `${scoreHome} x ${scoreAway} | *${user.nickname}*`;
      });

    return title + matchBets.join("\n");
  });

  return lines.join("\n\n");
}
async function parseRanking(roundNumber: null | number, group: string, ids: number[]) {
  const response = await apiRequest.get<IRankingResponse>(`ranking/edition`);
  let ranking;
  let title;

  if (roundNumber !== null) {
    const roundData = response.round.find((r) => r.round === roundNumber);
    if (!roundData) {
      return `Rodada *${roundNumber}* não encontrada.`;
    }
    ranking = roundData.ranking;
    title = `🏆 *${group} — Rodada ${roundNumber}*`;
  } else {
    ranking = response.edition;
    title = `🏆 *${group} — Geral*`;
  }

  if (ranking.length === 0) {
    return "Não há dados de ranking disponíveis";
  }

  const lines = ranking
    .filter((line) => ids.includes(line.user.id))
    .map((line) => {
      const { position, positionVariation, points, exacts } = line.accumulatedScore;
      const name = line.user.nickname ?? line.user.name;
      const trend = positionVariation > 0 ? "🔼" : positionVariation < 0 ? "🔽" : "➡️";
      return `${position}. ${trend} *${name}* — ${points}pts _(${exacts} exatos)_`;
    });

  return `${title}\n\n${lines.join("\n")}`;
}

bot.command("cade", async (ctx: any) => {
  const query = ctx.match.trim().toLowerCase();
  if (!query) {
    await ctx.reply("Usage: /cade _nome ou apelido_", { parse_mode: "Markdown" });
    return;
  }

  try {
    const response = await apiRequest.get<IRankingResponse>(`ranking/edition`);

    const found = response.edition.find((line) => {
      const name = (line.user.nickname ?? line.user.name).toLowerCase();
      return name.includes(query);
    });

    if (!found) {
      await ctx.reply(`Nenhum participante encontrado para *${ctx.match.trim()}*` + siteLink, {
        parse_mode: "Markdown",
      });
      return;
    }

    const { position, positionVariation, points, exacts, percentage } = found.accumulatedScore;
    const name = found.user.nickname ?? found.user.name;
    const trend = positionVariation > 0 ? "🔼" : positionVariation < 0 ? "🔽" : "➡️";

    await ctx.reply(
      `👤 *${name}*\n📊 ${position}º lugar ${trend}\n🏅 ${points}pts — ${exacts} exatos — ${percentage}%` + siteLink,
      { parse_mode: "Markdown" },
    );
  } catch (error: unknown) {
    console.error("Error fetching ranking:", error);
    await ctx.reply("Ocorreu um erro ao buscar o ranking. Por favor, tente novamente mais tarde." + siteLink, {
      parse_mode: "Markdown",
    });
    return;
  }
});

// Start the bot.
bot.start();
