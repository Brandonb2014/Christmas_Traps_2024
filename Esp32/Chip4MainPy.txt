from irrecvdata import irGetCMD
import network
import urequests
import utime

server_url = "http://192.168.0.146:3000/api"
sensorId = "11" #sensor number

#wifi credentials
wifi_ssid = "Gravemind"
wifi_password = "Let me in"

def connect_to_wifi():
    sta_if = network.WLAN(network.STA_IF)
    if not sta_if.isconnected():
        print("Connecting to WiFi...")
        sta_if.active(True)
        sta_if.connect(wifi_ssid, wifi_password)
        while not sta_if.isconnected():
            pass
    print("Connected to WiFi")
    print("IP Address:", sta_if.ifconfig()[0])

def send_data_to_server(url):
    headers = {"Content-Type": "application/json"}
    print("url:", url)
    try:
        response = urequests.post(url, data="", headers=headers)
        print("Data sent successfully. Status code:", response.status_code)
    except Exception as e:
        print("Error sending data:", e)
    finally:
        try:
            response.close()
        except Exception as e:
            print("Error closing response:", e)
            pass

def main():
    recvPin = irGetCMD(16)
    try:
        while True:
            irValue = recvPin.ir_read()
            if irValue and len(irValue) > 5:
                print("irValue:", irValue)
                playerId = irValue[len(irValue)-2:]
                print("playerId:", playerId)
                urlToSend = server_url + "?playerId=" + playerId + "&sensorId=" + sensorId
                print("urlToSend:", urlToSend)
                send_data_to_server(urlToSend)
    except Exception as e:
        print("Error in main:", e)
        pass

def start():
    connect_to_wifi()
    while True:
        main()

if __name__ == "__main__":
    start()

