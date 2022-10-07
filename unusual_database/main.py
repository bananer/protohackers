import os
import socket


def start_db(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", port))
    data = dict()
    encoding = "utf-8"
    version = "Snapchat for Databases"
    while True:
        raw_request, addr = sock.recvfrom(1000)
        request = raw_request.decode(encoding)
        eq_pos = request.find('=')
        if eq_pos == -1:
            # retrieve
            key = request
            val = version if key == "version" else \
                data[key] if key in data else \
                ""
            response = key + '=' + val
            sock.sendto(response.encode(encoding), addr)
        else:
            # insert
            key = request[0:eq_pos]
            value = request[eq_pos + 1:]
            data[key] = value


if __name__ == '__main__':
    port = os.environ.get('PORT') or "2345"
    start_db(int(port))
