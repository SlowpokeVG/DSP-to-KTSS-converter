# DSP to KTSS converter
Script for merging two separate DSP audio files into one stereo .KTSS or .g1l.nx file

# Usage
DSP2KTSS.js <leftChannel.dsp> <rightChannel.dsp> g1l | ktss

You will need two DSPADPCM files that were converted by AdpcmEncoder.exe from official Switch SDK.
Files should have same sample rate, same samplecount and should come from same WAV file. 
If DSP files had loop information, it'll be transferred to KTSS.

Special thanks to [Alex Barney](https://github.com/Thealexbarney) for his [DspTool](https://github.com/Thealexbarney/DspTool)
