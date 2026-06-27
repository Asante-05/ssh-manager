import platform
import subprocess


class PingService:
    @staticmethod
    def ping(host: str, timeout: int = 2) -> bool:
        """
        Returns True if the host responds to a ping.
        """

        system = platform.system().lower()

        if system == "windows":
            command = [
                "ping",
                "-n", "1",
                "-w", str(timeout * 1000),
                host,
            ]
        else:
            command = [
                "ping",
                "-c", "1",
                "-W", str(timeout),
                host,
            ]

        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        return result.returncode == 0