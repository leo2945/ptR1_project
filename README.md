Project Overview (ภาพรวมโปรเจกต์)
	เป็นหุ่นยนสำหรับลาดตะเวนภายในอาคารบนพื้นที่เรียบหรือลาดเอียงเล็กน้อย
	
Hardware Components
	
	Movement & Actuators
		4  x DC Motors with Mecanum Wheels
		PTZ bracket
		2 x RC Servo Motor MG995	
		2 x Tb6612fng
	Power System
		LiFePO4 12V 12.8V 15Ah
		2 x LM2596
		1 x XY-3606
	 Controllers
		Arduino Nano
		Arduino Mega2560 Pro
		Raspberry pi 4B
		32GB Micro SD Card
	Sensors & Vision
		Voltage Sensor Module
		Current Sensor Module
		YDLIDAR G2 Lidar
		กล้อง OV5640
	Miscellaneous Components
		2 x Relay module
		2 x Spotlight 12v
			
Pinout & Wiring

	Arduino Nano to Encoder 1-4
		encoder1(Font left)
			5v -> Vcc
			G -> G
			D11 -> A
			D10 -> B
		encoder2(Font right)
			5v -> Vcc
			G -> G
			D5 -> A
			D6 -> B
		encoder3(Rear left)
			5v -> Vcc
			G -> G
			D3 -> A
			D4 -> B
		encoder4(Rear right)
			5v -> Vcc
			G -> G
			D7 -> A
			D12 -> B
	Arduino Mega 2560 pro to Tb6612fng(Motor driver 1,2)
		Motor driver 1(Font left and Rear right)
			5v -> Vcc
			G -> G
			D12 -> PWMA
			D13 -> PWMB
			D35 -> AIN2
			D37 -> AIN1
			D39 -> STBY
			D41 -> BIN1
			D43 -> BIN2
		Motor driver 2(Font right and Rear left)
			5v -> Vcc
			G -> G
			D10 -> PWMA
			D11 -> PWMB
			D40 -> AIN2
			D42 -> AIN1
			D38 -> STBY
			D34 -> BIN1
			D36 -> BIN2
	Sensors to Arduino Mega 2560
		Hmc5883l to Arduino Mega 2560
			5v -> Vcc
			G -> G
			SCL -> SCL(21)
			SDA -> SDA(20)
			DRDY -> none
		MPU6050 to Arduino Mega 2560
			5v -> Vcc
			G -> G
			SCL -> SCL(21)
			SDA -> SDA(20)
		Voltage sensor to Arduino Mega 2560
			5v -> Vcc
			G -> G
			Vout -> A9
		Current sensor to Arduino Mega 2560
			5v -> Vcc
			G -> G
			Vout -> A11
	Arduino Mega 2560 pro to Servo
		D44 -> PWM_Servo1
		D46 -> PWM_Servo2
	Arduino Mega 2560 pro to Relay 1,2
		D33 -> R1
		D32 -> R2
	Arduino Mega 2560 pro to Arduino Nano
		Tx(D18) -> Rx(8)
		Rx(D19) -> Tx(9)
		G -> G
	Raspberry pi 4B to Arduino Mega 2560 (by UART)
	Raspberry pi 4B to Arduino Nano (by UART)
