from irrecvdata import irGetCMD
import network
import urequests
import utime

# Constants
SERVER_URL = "http://192.168.0.39:3000"
CHIP_ID = "3"
WIFI_SSID = "Gravemind"
WIFI_PASSWORD = "Let me in"

def connect_to_wifi():
    """
    Connects to WiFi using the specified SSID and password.
    """
    sta_if = network.WLAN(network.STA_IF)
    if not sta_if.isconnected():
        print("Connecting to WiFi...")
        sta_if.active(True)
        sta_if.connect(WIFI_SSID, WIFI_PASSWORD)
        retries = 10  # Number of attempts to connect

        while not sta_if.isconnected() and retries > 0:
            utime.sleep(1)  # Wait for a second before retrying
            retries -= 1
            print("Trying again...")

        if sta_if.isconnected():
            send_message_to_server("Connected to WiFi.")
            send_message_to_server(f"IP Address: {sta_if.ifconfig()[0]}")
        else:
            print("Failed to connect to WiFi")
    else:
        send_message_to_server("Already connected to WiFi")
        send_message_to_server(f"IP Address: {sta_if.ifconfig()[0]}")


def send_message_to_server(message):
    """
    Sends a log message to the server.
    """
    print(message)
    headers = {"Content-Type": "application/json"}
    url = f"{SERVER_URL}/message"
    payload = {'chipId': CHIP_ID, 'message': message}
    response = None  # Initialize response variable

    try:
        response = urequests.post(url, headers=headers, json=payload)
        print(f"Data sent successfully. Status code: {response.status_code}")
        
        if response.status_code != 200:
            # Print the response body for debugging
            print(f"Warning: Server responded with status code: {response.status_code}")
            print("Response message:", response.msg)  # Print the response message

    except OSError as e:
        print(f"Error sending message: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        if response:  # Check if response is not None before closing
            try:
                response.close()
                print("response closed")
            except Exception as e:
                print(f"Error closing response: {e}")

def send_data_to_server(url):
    """
    Sends sensor data to the server.
    """
    headers = {"Content-Type": "application/json"}
    try:
        response = urequests.post(url, data="", headers=headers)
        print(f"Data sent successfully. Status code: {response.status_code}")
        
        if response.status_code != 200:
            # Print the response body for debugging
            print(f"Warning: Server responded with status code: {response.status_code}")
            print("Response message:", response.text)  # Print the response message

    except Exception as e:
        print(f"Error sending data: {e}")
    finally:
        try:
            response.close()
        except Exception as e:
            print(f"Error closing response: {e}")

def main():
    recvPin13 = irGetCMD(13)
    recvPin14 = irGetCMD(14)
    recvPin15 = irGetCMD(15)

    try:
        while True:
            pin13Value = recvPin13.ir_read()
            pin14Value = recvPin14.ir_read()
            pin15Value = recvPin15.ir_read()
            
            if pin13Value and len(pin13Value) > 5:
                print("pin13Value: " + pin13Value)
                playerId = pin13Value[len(pin13Value)-2:]
                print("playerId:", playerId)
                urlToSend = SERVER_URL + "/api?playerId=" + playerId + "&sensorId=8"
                print("urlToSend:", urlToSend)
                send_data_to_server(urlToSend)
            if pin14Value and len(pin14Value) > 5:
                print("pin14Value:", pin14Value)
                playerId = pin14Value[len(pin14Value)-2:]
                print("playerId:", playerId)
                urlToSend = SERVER_URL + "/api?playerId=" + playerId + "&sensorId=9"
                print("urlToSend:", urlToSend)
                send_data_to_server(urlToSend)
            if pin15Value and len(pin15Value) > 5:
                print("pin15Value:", pin15Value)
                playerId = pin15Value[len(pin15Value)-2:]
                print("playerId:", playerId)
                urlToSend = SERVER_URL + "/api?playerId=" + playerId + "&sensorId=10"
                print("urlToSend:", urlToSend)
                send_data_to_server(urlToSend)
    except Exception as e:
        pass

def start():
    """
    Starts the application by connecting to WiFi and running the main loop.
    """
    connect_to_wifi()
    main()

if __name__ == "__main__":
    start()

