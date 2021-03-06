---
layout: page
title: Guides
permalink: /guides/
youtubeId: WSbjiJHFIf8
carousel:
  - image: /img/getstarted/removeBattery.jpg
    caption: Using the magnet to remove a CR1216 battery
  - image: /img/getstarted/removeOxide.jpg
    caption: Lightly scratching the pad to remove oxidization
  - image: /img/getstarted/pushBattery.jpg
    caption: Removing the battery by pushing it gently from the side
  - image: /img/getstarted/bendTabs.jpg
    caption: Pressing on the wings to increase connectivity
---

# Getting started

To start using the Grimlight, simply insert the coin cell battery in the battery holder. The circuit fits perfectly inside your standard Warhammer base but can be placed wherever you find convenient. Use adhesive tape to stick the top of the battery holder to the inside of the miniature base. We suggest you experiment with the lights and how to use them. Take care not to pull too hard on the wiring.  They are tougher than they look but can be damaged if treated roughly.

To add diffusion we suggest adding cotton or a drop of glue on top of the light. This also makes it easier to color them the way you prefer. If you want to color the lights be sure to apply a very thin coat of thinned paint such as a wash. Increase the amount of paint gradually until you achieve the desired color. It usually takes a single layer of wash to change the color.

To turn them on and off simply hold the magnets roughly half an inch above the circuit for a second. The sensor is on the side of the circuit so the distance may vary a bit depending on which side you are holding the magnet on. To switch effects on the lights simply keep holding the magnet close for about 10 seconds and you will see the lights changing effect.

To change or remove the battery use the magnets to slide it out. The tip of a pen also works.


# How to install and remove the battery

Be sure to use CR1220 (or CR1216 if you absolutely must have the lowest possible height) and slide it in from the side into the battery holder.

The lights should blink 3 times to indicate that the circuit is working and ready to be turned on. If they don’t there are two things you can do to improve connectivity. First, press lightly on top of the “wings” in the center of the battery holder to make them bend slightly downward. If that does not improve connectivity, try using a small metal file or similar object to scrape off any oxidization on the pad below the battery holder. See the pictures below.

How you remove the battery depends on how you installed the Grimlight. If you can access the circuit, simply pushing the battery gently from the side with a blunt object is enough. You can also use your magnet to remove a battery if you cant access the circuit itself (i.e. if you mounted in in a miniature base).

When you mount it, you can either place it upside down for easier access to the battery or mount it so that you leave the maximum amount of space available for the battery to slide out.

{% include gallery.html carouselSlides=page.carousel %}

# How to switch effects and use the magnet

Here´s a clip showing how the switching works.

{% include youtubePlayer.html id=page.youtubeId %}

# Changing firmware

To update the firmware on the Grimlight you need a few things.

* A programmer, for example a PICkit 3
* Some wires, or to make it easier [logic probe test clips](https://www.ebay.co.uk/itm/Logic-Analyzer-Cable-Probe-Test-Hook-Clip-Line-10-channels-5-Color-XB/142786101900?hash=item213eb7028c:g:dDgAAOSwYKNaqe2k)
* [MPLAB X IDE](https://www.microchip.com/mplab/mplab-x-ide) and the XC8 compiler installed.

![My setup]({{ site.baseurl }}/assets/img/prog_setup.png)

The microcontroller used on the Grimlight is a Microchip [PIC10F322](https://www.microchip.com/wwwproducts/en/PIC10F322). The pads for programming are exposed along the edge.

![Pinout]({{ site.baseurl }}/assets/img/connections.png)

The other components on the PCB is a battery holder, a couple of resistors for limiting current to the PCB and a MOSFET to protect everything if the battery is installed the wrong way.

The code delivered on all the Kickstarter Grimlights can be downloaded from [here]({{ site.baseurl }}/assets/programming/GrimLight_v20180524.tar). A stripped down version with additional comments is included below. All code is useable under standard 3-clause BSD license.

{% highlight c %}
// PIC10F322 Configuration Bit Settings
// 'C' source line config statements
// CONFIG
#pragma config FOSC = INTOSC    // Oscillator Selection bits (INTOSC oscillator: CLKIN function disabled)
#pragma config BOREN = OFF      // Brown-out Reset Enable (Brown-out Reset disabled)
#pragma config WDTE = ON        // Watchdog Timer Enable (WDT enabled)
#pragma config PWRTE = OFF      // Power-up Timer Enable bit (PWRT disabled)
#pragma config MCLRE = OFF      // MCLR Pin Function Select bit (MCLR pin function is digital input, MCLR internally tied to VDD)
#pragma config CP = OFF         // Code Protection bit (Program memory code protection is disabled)
#pragma config LVP = OFF        // Low-Voltage Programming Enable (High-voltage on MCLR/VPP must be used for programming)
#pragma config LPBOR = OFF      // Brown-out Reset Selection bits (BOR disabled)
#pragma config BORV = LO        // Brown-out Reset Voltage Selection (Brown-out Reset Voltage (Vbor), low trip point selected.)
#pragma config WRT = OFF        // Flash Memory Self-Write Protection (Write protection off)

#include <xc.h>
#include <pic10f322.h>

#define _XTAL_FREQ 4000000

enum p_state{OFF, ON}state;
unsigned char check=1;

void init_PWM();
void enter_sleep();
void init_osc();
void init();
void sleep_128ms();

void main(void) {
    //Setup prescalar for WDT
    //WDTPSx_bit used, default 2 seconds seems ok
    //WDTPS0=0;WDTPS1=1;WDTPS2=0;WDTPS3=1;WDTPS4=0;//1 s
    WDTPS0=1;WDTPS1=0;WDTPS2=0;WDTPS3=1;WDTPS4=0;//0.5 s
    //WDTPS0=0;WDTPS1=0;WDTPS2=0;WDTPS3=1;WDTPS4=0;//0.25 s

    //turn off voltage reference
    //FVREN = 0; //Default is off so no need to do manually
    VREGPM1 = 1; //Internal power regulator in power save

    //setup pins (inputs/outputs)
    ANSELA = 0x00; //all digital 
    PIE1bits.NCO1IE = 0; //RA2 as output
    CLKRCONbits.CLKROE = 0; //RA2 as output
    TRISA = 0x08; //RA3 input, rest output
    PORTA = 0x00;

    //Go to sleep, might accidently wake once
    enter_sleep();
    enter_sleep();

    unsigned char state_cnt=0;
    
    while(1){
        CLRWDT();
        
        //increase state_cnt if magnet is near Hall sensor
        if(state_cnt>1 && PORTAbits.RA3){
            state_cnt=0;
            if(!check)check=1;
            else
            {
                enter_sleep();
            }
        }
        
        if(0==PORTAbits.RA3){
            ++state_cnt;
        }
        
        PWM1DCH = 0xFF;
        PWM1DCL = 0xFF;
        PWM2DCH = 0xFF;
        PWM2DCL = 0xFF;

        while (!INTCONbits.TMR0IF);
        INTCONbits.TMR0IF = 0;
    }
}

void init(){
    init_osc();
    //setup timer for setting how fast effects change
    //Last three bits control PS
    //000 is 1:2
    //001 is 1:4
    //and so on...
    //111 is 1:256
    //Changing from 110 to 101 makes all effects
    //update twice as fast.
    OPTION_REG = 0b00000110; 
    INTCONbits.TMR0IF = 0;
    init_PWM(); 
}

void enter_sleep(){
    state=OFF;

    //Turn off PWM
    PWM1CONbits.PWM1OE = 0;
    PWM2CON0bits.PWM2OE = 0;
    
    //Turn off Hall
    PORTAbits.RA2 = 0; 
    
    //enter sleep, resume on WDT
    IRCF0 = 0; IRCF1 = 0; IRCF2 = 0;
    SLEEP();
    while(OFF==state){
        if(!STATUSbits.nTO){
            //woke due to WDT
            //Check if hall switch is pulled low, if, then wake (must first enable hall sensor)
            PORTAbits.RA2 = 1;  
            sleep_128ms();
            if(0 == PORTAbits.RA3){
                state = ON;
            }
            else{
                PORTAbits.RA2=0;    
                SLEEP();
            }
        }
    }
    check=0;
    PORTAbits.RA2 = 1; //Turn hall sensor on
    //Turn pwm on
    PWM1CONbits.PWM1OE = 1;
    PWM2CON0bits.PWM2OE = 1;
    //sleep to make sure it is on before leaving sleep
    sleep_128ms();
    init();
}

void sleep_128ms(){
    WDTPS0=1;WDTPS1=1;WDTPS2=1;WDTPS3=0;WDTPS4=0;
    SLEEP();
    NOP();
    WDTPS0=1;WDTPS1=0;WDTPS2=0;WDTPS3=1;WDTPS4=0; //set back WDT    
}

void init_PWM() {
    //set up for pwm
    TRISA0 = 1;
    TRISA1 = 1;
    PWM1CON = 0x00;
    PWM2CON = 0x00;
    PWM1DCH = 0x00;
    PWM1DCL = 0x00;
    PWM2DCH = 0x00;
    PWM2DCL = 0x00;
    ////set up Timer2
    PIR1bits.TMR2IF = 0;
    T2CON = 0b00000100; //timer on, no post scalar, prescaler is 1
    //enable pwm
    PWM1CONbits.PWM1EN = 1;
    PWM2CON0bits.PWM2EN = 1;
    while (!PIR1bits.TMR2IF); //wait for overflow
    TRISA0 = 0;
    TRISA1 = 0;
    PWM1CONbits.PWM1OE = 1;
    PWM2CON0bits.PWM2OE = 1;
    return;
}

void init_osc(){
    #if (4000000 == _XTAL_FREQ) 
        IRCF0 = 1;
        IRCF1 = 0;
        IRCF2 = 1; //4MHz, 0 0 0 is 31kHz low freq oscillator
    #endif
    #if (8000000 == _XTAL_FREQ) 
        IRCF0 = 0;
        IRCF1 = 1;
        IRCF2 = 1;
    #endif
}
{% endhighlight %}

# Assemble your own Grimlight

Battery holder and PCB can be bought directly from us, just drop us a mail and we will send you some! In addition to that the following parts are needed.

| Part |  Quantity | Part name |  Decription | Farnell ID
|-------|--------|---------|---------|---------|
| U1 | 1 | PIC10F322-I/OT | Microcontroller | 2079389 |
| U2 | 1 | IRLML6244TRPBF | Reverse current protection | 1864517 |
| U3 | 1 | TLE4913 | Magnet switch | 2215553 |
| C1 | 1 | 100 nF 0402 capacitor | Decoupling capacitor, use any you have on hand | 1758896 |
| C2 | 0 | | Not populated, decoupling capacitor for Hall sensor | |
| R1-2 | 2 | 0402 resistor | Current limiting resistor, value depends on LED and battery | |
