import { PORT } from "./config.ts";

const cmd = new Deno.Command("lsof", {
  args: ["-ti", `:${PORT}`],
});

const { stdout } = await cmd.output();
const output = new TextDecoder().decode(stdout).trim();

if (output) {
  const pids = output.split("\n").filter(Boolean);
  for (const pid of pids) {
    const killCmd = new Deno.Command("kill", {
      args: ["-9", pid],
    });
    await killCmd.output();
    console.log(`Port ${PORT} cleared (killed process ${pid}).`);
  }
}
