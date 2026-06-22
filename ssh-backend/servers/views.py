from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Server, CommandLog
from .forms import ServerForm
from .ssh_client import run_command


def home(request):

    servers = Server.objects.all()

    if request.method == "POST":
        form = ServerForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Server added successfully!")
            return redirect("/")

    else:
        form = ServerForm()

    return render(request, "servers/home.html", {"servers": servers, "form": form})

def delete_server(request, server_id):
    if request.method == "POST":
        server = get_object_or_404(Server, id=server_id)
        server.delete()
        messages.success(request, "Server deleted successfully!")
    return redirect("/")






def server_detail(request, server_id):

    server = get_object_or_404(
        Server,
        id=server_id
    )

    logs = server.command_logs.order_by("-created_at")
    
    output = None

    if request.method == "POST":

        command = request.POST["command"]

        output = run_command(
            server,
            command
        )

        CommandLog.objects.create(
            server=server,
            command=command,
            output=output
        )

    return render(
        request,
        "servers/server_detail.html",
        {
            "server": server,
            "output": output,
            "logs": logs
        }
    )