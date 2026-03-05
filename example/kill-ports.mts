#!/usr/bin/env zx

const ports = [5250, 5251, 5252];

for (const port of ports) {
	try {
		const { stdout } = await $`lsof -i :${port} -t`.quiet();
		const pids = stdout.trim().split("\n").filter(Boolean);
		for (const pid of pids) {
			await $`kill -9 ${pid}`.quiet().nothrow();
			console.log(`Killed PID ${pid} on port ${port}`);
		}
	} catch {
		console.log(`Port ${port} is free`);
	}
}
