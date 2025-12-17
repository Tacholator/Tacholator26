import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, Volume2, X } from 'lucide-react';
import SectionAudioPlayer from '@/components/learning/SectionAudioPlayer';

const courseWorkContent = {
  1: {
    title: 'Legal Responsibilities',
    sections: [
      {
        heading: 'Legal Responsibilities – Overview',
        body: `To drive safely and legally in the UK, every driver must understand their responsibilities for themselves and the vehicle they operate.

This includes:
• Being fit to drive
• Ensuring the vehicle is legal and roadworthy
• Avoiding distractions (such as mobile phones)
• Knowing what to do in the event of an accident
• Following the rules in the Highway Code`
      },
      {
        heading: '1. Your Fitness to Drive',
        body: `You must always be in a safe physical and mental condition to drive. The law requires you to understand how your health, eyesight, alcohol, drugs, tiredness and distractions affect your driving.

1.1 Health
• Some medical conditions must be reported to the DVLA.
• You must not drive if a condition affects your ability to drive safely.
• Failing to notify the DVLA can lead to a fine of up to £1,000 and possible prosecution if you are involved in a collision.

1.2 Eyesight
• You must be able to read a number plate from 20 metres.
• If you need glasses or contact lenses to meet this standard, you must wear them whenever you drive.
• Driving with poor eyesight can result in penalty points, fines or disqualification.

1.3 Alcohol
• There is a legal limit for alcohol, but the safest option is not to drink at all if you plan to drive.
• Penalties for drink driving can include up to 6 months in prison, a driving ban (minimum 12 months) and unlimited fines.

1.4 Drugs
• You must never drive after taking drugs that impair your ability to drive.
• This includes illegal drugs and some prescription or over-the-counter medicines that cause drowsiness.
• Penalties for drug driving can include up to 6 months in prison, a driving ban and unlimited fines.

1.5 Tiredness
• Tiredness significantly increases the risk of collisions.
• You should avoid driving when tired and take regular breaks, ideally at least every 2 hours on long journeys.

1.6 Mobile Phones
• It is illegal to use a handheld mobile phone while driving.
• Even hands-free devices can distract you and slow your reaction time.
• Penalties can include 6 penalty points, a £200 fine and possible disqualification, especially for new drivers.
• These rules also apply to anyone supervising a learner driver.`
      },
      {
        heading: '2. Vehicle Legal Requirements',
        body: `Before driving, you are legally responsible for making sure the vehicle is safe and legal to use on the road.

2.1 Vehicle Tax
• All vehicles used on public roads must be properly taxed.

2.2 MOT Certificate
• Vehicles over 3 years old must have a valid MOT certificate.
• Driving without a valid MOT can result in a fine of up to £1,000.

2.3 Insurance
• You must have the correct insurance to drive the vehicle.
• Driving without insurance can lead to 6–8 penalty points, unlimited fines and the vehicle being seized.

2.4 Roadworthiness
• Your vehicle must be in a safe, roadworthy condition.
• This includes having legal tyres, effective brakes, working lights and safe steering.
• Driving an unroadworthy vehicle is a criminal offence.

2.5 L Plates / D Plates
• Learner drivers must display L plates clearly at the front and rear of the vehicle.
• In Wales, D plates may be used instead of L plates.`
      },
      {
        heading: '3. Who Can Teach You to Drive?',
        body: `Learners must be properly supervised when driving.

Supervising drivers must:
• Be at least 21 years old.
• Have held a full driving licence for at least 3 years.
• Be qualified to drive the type of vehicle being used (for example, manual or automatic).

Paid driving lessons:
• Only Approved Driving Instructors (ADIs) or trainee driving instructors with a valid trainee licence may charge money for lessons.
• Instructors must display their official ADI or trainee badge on the windscreen during lessons.
• Receiving paid instruction from an unqualified person is illegal.`
      },
      {
        heading: '4. Distractions and Mobile Phones',
        body: `Distractions are a major cause of collisions, and mobile phones are one of the most common distractions.

4.1 Mobile Phone Rules
• It is illegal to use a handheld mobile phone while driving.
• This includes making calls, texting, using apps or checking notifications.
• Even hands-free use can distract your attention from the road.

4.2 Best Practice
• Switch off your phone or put it on silent before you start driving.
• Place your phone out of reach to avoid temptation.

4.3 Supervisors
• Supervising drivers must also follow mobile phone laws.
• They share responsibility for the safety of the vehicle and the learner driver.`
      },
      {
        heading: '5. Accidents and Emergencies',
        body: `If you are involved in a collision, there are specific legal duties you must follow.

After a collision you MUST:
• Stop at the scene.
• Provide your name and address.
• Provide your insurance details.
• Provide the vehicle owner's details if different from the driver.

If details are not exchanged at the scene, you must report the incident to the police within 24 hours.

Failing to stop or failing to report an accident is a criminal offence.`
      },
      {
        heading: '6. Other Legal Responsibilities',
        body: `As a driver or learner driver, you have several ongoing legal responsibilities.

You must:
• Keep your driving licence details up to date, including your name and address.
• Maintain legal eyesight standards at all times.
• Inform the DVLA of any medical condition that affects your ability to drive.
• Follow all relevant rules set out in the Highway Code.
• Make sure you hold the correct licence category for the vehicle you are driving.

Understanding and following these legal responsibilities helps keep you, your passengers and other road users safe.`
      }
    ]
  },
  2: {
    title: 'Safety Checks – FLOWER',
    sections: [
      {
        heading: '1. Safety Checks Before You Drive',
        body: `Before you start the engine, it is essential that your car is in good working order. You should know what to check, how to check it and how often to do it.

A simple way to remember the key safety checks is to think of the word FLOWER. Each letter stands for an important part of the vehicle that you should check before driving.`
      },
      {
        heading: '2. FLOWER – Key Pre-Drive Checks',
        body: `Use the acronym FLOWER to remember the main checks:

• F – Fuel
• L – Lights
• O – Oil
• W – Water / Screenwash / Coolant
• E – Electrics
• R – Rubber (Tyres)

Each of these checks helps ensure your vehicle is safe, reliable and legal before you set off.`
      },
      {
        heading: '3. F – Fuel',
        body: `Think of a fuel pump icon to represent this check.

Before every journey, ask yourself:
• Do I have enough fuel for the whole journey?
• If not, where will I refuel on the way?

Running low on fuel can be dangerous, especially on motorways or in unfamiliar areas, so always plan ahead.`
      },
      {
        heading: '4. L – Lights',
        body: `Think of a headlight beam icon to represent your lights.

You should check that:
• All headlights, rear lights, brake lights and indicators are working.
• Lights are clean so that other road users can see you clearly.

You can walk around the car to check the lights or ask someone to help you. Using reflections in windows or mirrors can also help when checking on your own.`
      },
      {
        heading: '5. O – Oil',
        body: `Think of an oil can or oil drop icon for this check.

You should know:
• Where the engine oil dipstick is located.
• How to check the engine oil level and top it up if needed.
• Where and how to check the level of brake fluid.

Low oil can cause serious engine damage, and low brake fluid can affect your braking performance, so these checks are extremely important.`
      },
      {
        heading: '6. W – Water, Screenwash and Coolant',
        body: `Think of a water droplet icon to represent this section.

You should know:
• Where the coolant reservoir is and how to check that the level is between the minimum and maximum marks.
• Where the screenwash bottle is and how to ensure it is topped up.
• How to check that wiper blades are in good condition and not damaged.

Correct coolant levels help prevent the engine from overheating, while clean screenwash and working wipers keep your windscreen clear for good visibility.`
      },
      {
        heading: '7. E – Electrics',
        body: `Think of a battery symbol or lightning bolt for your electrical checks.

You should:
• Make sure the battery appears secure and in good condition.
• Check that indicators, horn and other warning devices are working.
• Look out for any warning lights on the dashboard that stay on after the engine starts.

Good electrics are essential for safe communication with other road users and for the correct operation of safety systems.`
      },
      {
        heading: '8. R – Rubber (Tyres)',
        body: `Think of a tyre icon for this check.

You should check:
• Tyre pressure is at the correct level for your vehicle (check the vehicle handbook or door frame sticker).
• Tread depth is at least the legal minimum of 1.6 mm across the central three-quarters of the tyre and around the full circumference.
• Tyre condition for cuts, bulges, uneven wear or any visible damage.

Tyres are vital for grip, braking and stability. Worn or damaged tyres are dangerous and illegal.`
      },
      {
        heading: '9. Final Pre-Drive Checks',
        body: `In addition to the FLOWER checks, you should always make sure your brakes and steering are working properly before you drive.

• Press the brake pedal to confirm it feels firm and responsive.
• Move the steering wheel slightly to ensure it turns smoothly.
• Check for any unusual noises or warning lights.

Completing these checks before every journey helps keep you, your passengers and other road users safe.`
      }
    ]
  },
  3: {
    title: 'Security',
    sections: [
      {
        heading: '1. Security Overview',
        body: `Security involves protecting your vehicle, its contents and your own personal safety. By staying aware of potential risks and taking simple precautions, you can significantly reduce the chance of theft, damage or harm.`
      },
      {
        heading: '2. Stay Alert at All Times',
        body: `Remain aware of your surroundings whenever you are:
• Approaching your vehicle
• Getting in or out of the car
• Stopped in traffic or at junctions

Avoid distractions that reduce your awareness, such as unnecessary mobile phone use or wearing headphones that block out external sounds.`
      },
      {
        heading: '3. Let Someone Know Your Plans',
        body: `Where possible, tell a trusted person:
• Where you are going
• When you expect to arrive
• When you plan to return

This is especially important when driving alone, travelling at night or going to unfamiliar locations.`
      },
      {
        heading: '4. Protect Your Belongings',
        body: `Keep important or valuable items out of sight while you are in or away from the car. For example:
• Store bags, electronic devices and documents in the glovebox, boot or under a seat
• Avoid leaving items visible on seats or the dashboard

A visible item can tempt opportunistic thieves, even if the vehicle is locked.`
      },
      {
        heading: '5. Choose a Secure Place to Park',
        body: `Whenever possible, choose a parking place that is:
• Well lit
• Busy and overlooked by nearby buildings
• Covered by CCTV or security patrols

Avoid leaving your car in isolated or poorly lit areas, particularly at night or for long periods of time.`
      },
      {
        heading: '6. Use Additional Security Measures',
        body: `You can reduce the risk of theft by fitting extra security devices, such as:
• A steering wheel lock
• An immobiliser
• An alarm system
• Vehicle tracking devices or window etching

These measures make your vehicle less attractive to thieves and may help deter or detect crime.`
      }
    ]
  },
  4: {
    title: 'Cockpit Drill / DSSSM Routine',
    sections: [
      {
        heading: '1. Cockpit Drill / DSSSM Overview',
        body: `The Cockpit Drill, also known as the DSSSM Routine, is a set of essential safety checks that must be carried out every time you get into the car before driving. These checks ensure you are safe, comfortable and fully in control of the vehicle.

DSSSM stands for:
• D – Doors
• S – Seat
• S – Steering
• S – Seatbelt
• M – Mirrors

Completing these checks before every journey helps reduce risks and ensures good driving habits.`
      },
      {
        heading: '2. Doors',
        body: `Make sure all doors are properly closed and secure before you begin your journey.

You should:
• Check visually that each door is shut
• Listen for the click when closing
• Look for any door-warning lights on the dashboard

Loose or open doors can be dangerous and may distract you or harm passengers.`
      },
      {
        heading: '3. Seat',
        body: `Adjust your seat so you can reach all the controls comfortably and safely.

Your seat position is correct when:
• You can fully press the clutch without stretching
• Your arms are slightly bent when holding the steering wheel
• You are sitting upright with proper back support
• You have a clear view of the road and mirrors

A proper seating position improves comfort, control and reaction time.`
      },
      {
        heading: '4. Steering',
        body: `Check that the steering wheel is correctly positioned and secure.

Ensure that:
• You can turn the wheel fully without leaning forward
• The wheel is firmly locked in place (if adjustable)
• Nothing obstructs your view of the dashboard

Smooth and comfortable steering control is essential for safe driving.`
      },
      {
        heading: '5. Seatbelt',
        body: `Seatbelts must be worn by the driver and all passengers before the vehicle moves.

Check that your seatbelt:
• Is not twisted
• Clicks securely into place
• Fits properly across your chest and hips

Drivers are legally responsible for ensuring that children under 14 are properly restrained.`
      },
      {
        heading: '6. Mirrors',
        body: `Adjust all mirrors to maximise visibility and reduce blind spots before you move off.

Interior Mirror:
• Should provide a clear view directly through the rear window

Right Door Mirror:
• Should show the road behind and a small part of the vehicle's side

Left Door Mirror:
• Helps you see cyclists, pedestrians and approaching vehicles on the left

Mirrors must never be adjusted while driving. Always set them before starting your journey.`
      },
      {
        heading: '7. Summary',
        body: `The Cockpit Drill and the DSSSM Routine follow the same essential checks. Before driving, always complete the following:

1. Doors – Confirm all doors are securely closed
2. Seat – Adjust for comfort, control and visibility
3. Steering – Ensure correct position and free movement
4. Seatbelt – Fasten securely and check passengers
5. Mirrors – Adjust for maximum visibility

Performing these checks every time you get into the vehicle ensures you start every journey safely and confidently.`
      }
    ]
  },
  5: {
    title: 'Main Car Controls',
    sections: [
      {
        heading: '1. Main Car Controls – Overview',
        body: `To drive safely and confidently, you must understand the purpose and correct use of the main controls in the car. These are divided into three groups:

1. Foot Controls
2. Hand Controls
3. Ancillary Controls

Each group plays an essential role in controlling the vehicle smoothly and safely.`
      },
      {
        heading: '2. Foot Controls',
        body: `Foot controls are operated using your feet and are found in the driver's footwell. Manual and automatic vehicles differ, but the essential functions remain similar.

2.1 Accelerator (Gas Pedal)
• Controls the speed of the car.
• Press gently to increase speed; ease off to reduce speed.
• Must be used smoothly for good control and fuel efficiency.

2.2 Footbrake (Service Brake)
• Slows the car down using the brake system.
• Apply progressive pressure: press smoothly and release smoothly.
• Harsh or sudden braking can cause skidding or discomfort to passengers.

2.3 Clutch (Manual Cars Only)
• Separates the engine from the wheels.
• Allows you to change gear, stop without stalling, and move off smoothly.
• Press fully down to disengage the engine; release gradually for a smooth take-off.

Note: Automatic cars do not have a clutch pedal – they only have an accelerator and a brake.`
      },
      {
        heading: '3. Hand Controls',
        body: `Hand controls are operated using your hands while you maintain a safe grip on the steering wheel. They help you control the direction, speed, and communication with other road users.

3.1 Steering Wheel
• Controls the direction of the car.
• Hold the wheel at the 9-and-3 or 10-and-2 positions for maximum control.
• Use smooth movements; avoid harsh or jerky steering.

3.2 Handbrake (Parking Brake)
• Secures the car when it is stationary.
• Used when parking, stopping on a hill, or in some temporary stop situations.
• Prevents the vehicle from rolling.

3.3 Gear Lever
• In manual cars, used to select gears (1–5/6 and reverse).
• In automatic cars, typically uses positions such as P (Park), R (Reverse), N (Neutral), and D (Drive).
• Correct gear selection allows the car to move efficiently at different speeds.

3.4 Indicators (Signal Stalk)
• Used to signal direction changes (left or right) to other road users.
• Must be used in good time before turning, changing lanes, or pulling over.

3.5 Horn
• Used to warn others of your presence.
• Should only be used when necessary for safety and not in anger or as a greeting.
• Must not be used unnecessarily, especially in built-up areas at night.`
      },
      {
        heading: '4. Ancillary Controls',
        body: `Ancillary controls support safety, visibility and comfort while driving. You must learn how to use them without losing control of the vehicle.

4.1 Lights
• Includes headlights, sidelights, brake lights, fog lights and sometimes daytime running lights.
• Essential for driving at night, in poor weather, or in low visibility.
• You should know how to switch between dipped and main beam and when each is appropriate.

4.2 Wipers and Washers
• Keep the windscreen and rear window clear of rain, dirt and spray.
• Use the washers to spray cleaning fluid when the screen becomes dirty.
• Adjust wiper speed according to the intensity of the rain.

4.3 Demisters (Front and Rear)
• Used to clear condensation or mist from windows.
• Front demister uses the heater and ventilation controls to blow warm air onto the windscreen.
• Rear demister uses an electric heating grid in the rear window.

Clear visibility through all windows is both a safety requirement and a legal obligation.`
      },
      {
        heading: '5. Summary',
        body: `Understanding the main car controls is fundamental to becoming a safe and confident driver. By mastering:

• Foot Controls (accelerator, footbrake, clutch in manual cars)
• Hand Controls (steering wheel, handbrake, gear lever, indicators, horn)
• Ancillary Controls (lights, wipers, demisters)

you will be able to control the vehicle smoothly, respond safely to hazards, and meet DVSA driving test standards.`
      }
    ]
  },
  6: {
    title: 'Stopping Safely',
    sections: [
      {
        heading: '1. Stopping Safely – Overview',
        body: `Stopping safely is a fundamental driving skill. A safe stop must be controlled, legal and predictable, without causing danger or inconvenience to other road users.

To stop safely, drivers use two key DVSA routines:
• MSM – Mirror, Signal, Manoeuvre
• PSL – Position, Speed, Look

These routines work together to help you plan, carry out and complete every stop in a safe and professional way.`
      },
      {
        heading: '2. MSM Routine (Mirror, Signal, Manoeuvre)',
        body: `The MSM routine helps you decide when and how to stop safely.

M – Mirrors
Before you change speed or direction, check your mirrors:
• Look in the interior mirror first.
• Then check the door mirror on the side you intend to move towards.

This allows you to see:
• What is behind you.
• How close following traffic is.
• Whether it is safe to begin slowing down and moving towards the kerb.

S – Signal
Give a signal if it will benefit other road users such as drivers, cyclists or pedestrians.
• Signal at the right time, not too early and not too late.
• Avoid signalling so early that others are confused about where you intend to stop.

M – Manoeuvre
Once it is safe and you have signalled (if necessary), begin the manoeuvre:
• Gradually position the car towards the left.
• Reduce speed smoothly.
• Prepare to stop in a safe place.

The manoeuvre phase is supported by the PSL routine.`
      },
      {
        heading: '3. PSL Routine (Position, Speed, Look)',
        body: `The PSL routine helps you carry out the manoeuvre safely and under full control.

P – Position
• Move the car gradually and smoothly towards the left-hand side of the road.
• Keep the car parallel to the kerb.
• Avoid stopping too close to parked vehicles or blocking driveways.
• Check the left mirror for cyclists before moving left.

S – Speed
• Reduce your speed using progressive, gentle braking.
• Brake early and smoothly rather than harshly.
• In a manual car, press the clutch pedal just before the car stops to prevent stalling.

L – Look
• Continue observing all around as you slow down.
• Check mirrors again for traffic behind.
• Look for pedestrians, cyclists or vehicles that may be affected.
• Watch for hazards at the kerb, such as drains or uneven surfaces.

Position, Speed and Look work together to make the stopping manoeuvre safe and controlled.`
      },
      {
        heading: '4. Safe Stopping Procedure (MSM + PSL)',
        body: `Bringing MSM and PSL together, a safe stopping procedure looks like this:

1. Mirrors – Check interior mirror, then the appropriate door mirror.
2. Signal – Signal if it will benefit other road users.
3. Position – Move smoothly towards the kerb, staying parallel.
4. Speed – Gently reduce speed using progressive braking.
5. Look – Keep checking mirrors and surroundings as you approach the stopping point.
6. Stop – Bring the car to a smooth, controlled halt in a safe position.
7. Secure the car – Apply the handbrake, select neutral (or Park in an automatic), and cancel the signal.

Following these steps helps you stop in a way that is safe, predictable and professional.`
      },
      {
        heading: '5. What a Good Stopping Position Looks Like',
        body: `A safe and correct stopping position means the car is:
• Parallel to the kerb.
• Close to the kerb, but not touching it.
• In a place that does not block driveways or entrances.
• Not too close to junctions, bends or pedestrian crossings.
• Not forcing other drivers or cyclists to take sudden avoiding action.

Driving examiners look for consistent, safe stopping positions that show good judgement and control.`
      },
      {
        heading: '6. Securing the Vehicle',
        body: `Once the vehicle has come to a complete stop, you must secure it so it cannot move unintentionally.

To secure the car:
• Apply the handbrake.
• Select neutral in a manual car, or P (Park) in an automatic.
• Cancel any indicator that is still on.
• Remove your feet from the pedals and prepare for your next move.

Securing the vehicle properly prevents roll-back, protects other road users and shows good driving practice.`
      },
      {
        heading: '7. When You May Need to Stop',
        body: `You will need to stop safely in many everyday situations, for example:
• When asked by the examiner to pull over during a driving test.
• When stopping behind or between parked vehicles.
• When dealing with hazards or obstructions in the road.
• When emergency vehicles need space to pass.
• If you feel unwell, unsure or need time to regain focus.
• To deal with passengers or adjust controls safely.

In every case, you should apply the MSM and PSL routines before stopping.`
      },
      {
        heading: '8. Summary',
        body: `Safe stopping relies on:
• MSM (Mirror, Signal, Manoeuvre) for planning and decision-making.
• PSL (Position, Speed, Look) for carrying out the manoeuvre under full control.
• Smooth, progressive braking.
• Careful choice of a safe and legal stopping place.
• Securing the vehicle correctly once stopped.

By practising MSM and PSL every time you stop, you will develop safe habits that meet DVSA standards and help protect yourself and other road users.`
      }
    ]
  },
  7: {
    title: 'Moving Off Safely – POM Routine',
    sections: [
      {
        heading: '1. Moving Off Safely – Overview',
        body: `Moving off safely means joining the traffic flow smoothly, confidently and without causing danger or inconvenience to other road users.

The DVSA-approved routine for moving off is:

POM – Prepare, Observe, Move

This routine ensures the car is ready, all around observations are completed, and the movement itself is smooth and safe.`
      },
      {
        heading: '2. P – Prepare',
        body: `Prepare the vehicle so it is ready to move without hesitation.

Manual Car:
• Press the clutch pedal fully down.
• Select 1st gear.
• Apply a small amount of gas.
• Raise the clutch to the bite point.
• Make sure the car feels ready to move (slight engine sound change, no juddering).

Automatic Car:
• Keep your foot firmly on the brake.
• Select D (Drive).
• Apply gentle pressure to the accelerator if needed.

The goal in the Prepare stage is to have the car fully ready so that when you release the handbrake, it moves forward smoothly and under control.`
      },
      {
        heading: '3. O – Observe (6-Point Observation Check)',
        body: `Observation is the most important part of moving off. Before you move, you must check all around the vehicle to make sure it is completely safe.

Use this 6-point observation check in the following order:

1. Left Blind Spot
   • Look over your left shoulder.
   • Check for cyclists, pedestrians or vehicles that may not appear in your mirrors.

2. Left Door Mirror
   • Check for cyclists, pedestrians or any traffic approaching on the inside.

3. Ahead (Front Window)
   • Look through the windscreen.
   • Check for hazards, pedestrians, oncoming vehicles and changing road or traffic conditions.

4. Interior Mirror
   • Check what is directly behind you.
   • Judge whether moving off may cause anyone to slow down or change direction.

5. Right Door Mirror
   • Look for approaching vehicles, motorbikes or cyclists coming from behind on your right.

6. Right Blind Spot (Most Important)
   • Look over your right shoulder into the blind spot.
   • Check carefully for cyclists, motorcyclists or other vehicles that are not visible in your mirrors.

If you see any road user who may be affected by your movement, you must wait until it is clearly safe.

Failing to check the right blind spot before moving off is a serious fault in the driving test.`
      },
      {
        heading: '4. M – Move',
        body: `Once the car is prepared and you have completed the 6-point observation check, you can move off.

Manual Car:
• Release the handbrake smoothly.
• Add slightly more gas as the car begins to move.
• Raise the clutch gradually to avoid stalling.
• Steer gently away from the kerb and into a normal driving position.

Automatic Car:
• Release the handbrake.
• Apply gentle pressure to the accelerator.
• Steer smoothly into the correct road position.

After moving off:
• Build up speed gradually to match the flow of traffic.
• Cancel your signal (if used).
• Check your mirrors again as part of normal driving.
• Position your vehicle correctly in the lane.

The movement should always be smooth, controlled and predictable.`
      },
      {
        heading: '5. Summary – POM for Moving Off',
        body: `To move off safely every time, follow the POM routine:

• P – Prepare
  • Get the car ready (gear, gas, bite point in a manual; Drive selected in an automatic).

• O – Observe
  • Complete a full 6-point observation check in this order:
    1. Left blind spot
    2. Left door mirror
    3. Ahead
    4. Interior mirror
    5. Right door mirror
    6. Right blind spot

• M – Move
  • Move away smoothly, under full control, without affecting other road users.

Using the POM routine consistently ensures that every time you move off, you do so safely, confidently and in line with DVSA driving test standards.`
      }
    ]
  },
  8: {
    title: 'Use of Mirrors',
    sections: [
      {
        heading: '1. Use of Mirrors – Overview',
        body: `Using mirrors correctly is essential for safe driving. Mirrors help you stay aware of your surroundings so you can make safe decisions without endangering yourself or other road users.

Good mirror use allows you to:
• Judge the speed and distance of traffic behind
• Know when it is safe to change direction or speed
• Avoid surprising or obstructing others
• Anticipate hazards early

Proper mirror use should become a natural part of your driving routine.`
      },
      {
        heading: '2. Types of Mirrors',
        body: `Most vehicles have three main mirrors, each giving a different view of what is happening around you.

Interior Mirror (Main Rear-View Mirror)
• Gives a clear view of the road directly behind the vehicle.
• Provides an accurate sense of distance (not distorted).
• Should be used before any change in speed or direction.

Right Door Mirror
• Shows traffic approaching from behind on your right.
• Important before moving off, overtaking or changing lanes.

Left Door Mirror
• Shows traffic on your left, including cyclists and pedestrians.
• Important before turning left, pulling in or moving towards the kerb.`
      },
      {
        heading: '3. Mirrors and the MSM Routine',
        body: `Mirror use forms the essential first step of the MSM (Mirror, Signal, Manoeuvre) routine.

M – Mirrors
You must check your mirrors before doing anything else.

When to check mirrors:
You must check your mirrors before any change in speed or direction, including:
• Before moving off from the side of the road.
• Before moving off in traffic or at traffic lights.
• Before turning left or right.
• Before changing lanes.
• Before slowing down or braking.
• Before overtaking or passing parked cars.
• Before pulling over to stop.
• Before joining or leaving roundabouts.

Checking mirrors at the right time helps you understand what is happening behind and around you so you can plan safely.`
      },
      {
        heading: '4. What You Are Checking For',
        body: `When you check your mirrors, you are not just looking – you are judging:
• Who is behind you.
• How close they are.
• How fast they are approaching.
• Whether your planned action will affect them.

Good mirror use helps you avoid forcing others to brake, swerve or react suddenly because of what you do.`
      },
      {
        heading: '5. Situations Where You Must Use Mirrors',
        body: `Correct and timely mirror checks are essential in many driving situations.

Moving Off (from the side of the road)
• Check the interior mirror, right door mirror and right blind spot before moving away.

Moving Off in Traffic or at Traffic Lights
• Check the interior mirror and right door mirror.
• Make sure no motorcyclists or cyclists are filtering between lanes before you set off.

Slowing Down
• Check the interior mirror before braking.
• Check the right mirror if you need to brake more firmly.

Turning Left
• Check the interior mirror and left mirror.
• Look for cyclists, scooters and pedestrians on your left side.

Turning Right
• Check the interior mirror and right mirror.
• Look for vehicles approaching quickly from behind that may try to overtake.

Changing Lanes
• Check the interior mirror.
• Check the mirror on the side you want to move.
• Check your blind spot before moving across.

Overtaking
• Check the interior mirror and right mirror.
• Check your blind spot to ensure no one is overtaking you.

Stopping or Pulling In
• Check the interior mirror and left mirror.
• Make sure you do not cut across cyclists or surprise drivers behind.`
      },
      {
        heading: '6. Mirrors and Blind Spots',
        body: `Mirrors do not show everything. There are areas around the car, known as blind spots, that you cannot see in any mirror.

You must check your blind spots by turning your head to look over your shoulder when:
• Moving off.
• Overtaking.
• Changing lanes.
• Joining traffic.
• Pulling over.

Ignoring blind spots is dangerous and is a common serious fault on the driving test.`
      },
      {
        heading: '7. Key Rules for Effective Mirror Use',
        body: `To use mirrors effectively, remember these key rules:

• Check mirrors early and in good time before any change in speed or direction.
• Check mirrors regularly as part of your normal driving routine.
• Always use mirrors before signalling or braking.
• Use the correct mirror for the situation (left mirror for left movements, right mirror for right movements).
• Be especially aware of fast-moving hazards such as motorcycles and cyclists.
• Never rely on mirrors alone – always combine mirror use with blind spot checks where needed.`
      },
      {
        heading: '8. Summary',
        body: `Correct mirror use is a core part of safe driving. It helps you:
• Make safer decisions.
• Maintain awareness of traffic around you.
• Avoid surprising other road users.
• Meet DVSA driving test standards.

You must check your mirrors before every change in speed or direction, especially before moving off – whether from the roadside or in traffic. Combined with blind spot checks, good mirror use keeps you and others safe on the road.`
      }
    ]
  },
  9: {
    title: 'Use of Signals',
    sections: [
      {
        heading: '1. Use of Signals – Overview',
        body: `Signals are an essential part of safe driving. They help you communicate your intentions clearly to other road users so they can predict your actions and respond safely.

Using signals correctly prevents confusion, reduces the risk of collisions and helps keep traffic flowing smoothly.

Signals must always be:
• Timely
• Clear
• Necessary

They must never mislead other road users.`
      },
      {
        heading: '2. Purpose of Signals',
        body: `Signals are used to:
• Inform others of your intentions.
• Give road users enough time to react.
• Reduce the chance of misunderstanding.
• Help keep traffic moving safely and smoothly.

Effective signalling helps drivers, cyclists, pedestrians and other road users understand what you plan to do next.`
      },
      {
        heading: '3. Types of Signals',
        body: `There are several types of signals used in normal driving.

3.1 Indicator Signals
• Used for left and right turns, lane changes, pulling over and moving off.
• Must be given in good time.
• Must be cancelled after you complete the manoeuvre.
• Should only be used when they help or inform other road users.

3.2 Brake Signals
• Your brake lights warn drivers behind that you are slowing down.
• Use them progressively and in good time.
• This is especially important when you need to slow down more quickly than normal.

3.3 Hazard Warning Lights
• Used to warn others of a temporary hazard or obstruction.
• Examples include a breakdown, a stopped vehicle causing an obstruction, or an emergency situation.
• Do not use hazard lights while moving, except on a motorway or dual carriageway to warn of sudden danger ahead.

3.4 Hand Signals
• Occasionally used if indicators are not working or to reinforce your intentions.
• Drivers should understand common hand signals, although they are rarely needed in modern driving.`
      },
      {
        heading: '4. The Golden Rule – Only Signal If It Benefits Others',
        body: `A signal that is unnecessary or badly timed can be confusing or dangerous.

Before signalling, ask yourself: "Does anyone need this signal?"
• If yes, give a clear, timely signal.
• If no, do not signal.

Examples of misleading signals:
• Signalling left when passing a side road, making others think you are turning.
• Signalling too early before a junction, causing confusion.
• Signalling after you have already started turning.
• Signalling right when the road bends right but you are not turning.`
      },
      {
        heading: '5. When You Must Use Signals',
        body: `You should use signals whenever they will help other road users understand your intentions. This includes:

• Before turning left or right
  • Signal early enough to give others time to react.

• Before changing lanes
  • Signal and then check mirrors and blind spots before moving.

• Before overtaking
  • Signal right before you move out.
  • Signal left after you have safely passed, if appropriate.

• Before pulling over or stopping
  • Signal left to show you are moving towards the kerb.

• Before moving off
  • Signal right if it will help or inform traffic behind.

• At roundabouts
  • Signal to show your chosen exit and to indicate lane changes.

• When merging
  • Signal to show your intention to join the flow of traffic.`
      },
      {
        heading: '6. Timing of Signals',
        body: `Signals must be:
• Given in good time.
• Clear and easy to understand.
• Cancelled once the manoeuvre is complete.

The correct timing depends on speed and situation:
• At higher speeds (e.g. dual carriageways), signal earlier to give others more time.
• In slow-moving urban traffic, signal slightly later but still in good time.
• When moving off from the side of the road, signal only when you are actually ready to move, not while you are still preparing.

A poorly timed signal can be just as dangerous as not signalling at all.`
      },
      {
        heading: '7. Signals and the MSM Routine',
        body: `Signals form the second step of the MSM (Mirror, Signal, Manoeuvre) routine.

The correct order is:
1. Mirrors – Check who is around you and whether it is safe.
2. Signal – If it will benefit or inform other road users.
3. Manoeuvre – Carry out your action (change speed, direction or position).

You should never signal before checking your mirrors. You must always know who might be affected by your actions before you indicate.`
      },
      {
        heading: '8. Summary',
        body: `Good signalling is a key part of safe, responsible driving. To use signals correctly, you must ensure they are:

• Necessary – Only give a signal if it benefits other road users.
• Clear – Easy for others to see and understand.
• Timed correctly – Neither too early nor too late.
• Cancelled once finished – Avoid ongoing or misleading signals.
• Used with MSM – Always check mirrors before signalling.

Correct use of signals helps other road users anticipate your intentions, reduces the risk of collisions and is essential for passing the driving test.`
      }
    ]
  },
  10: {
    title: 'Junctions',
    sections: [
      {
        heading: '1. Junctions – Overview',
        body: `Junctions are places where roads meet. They are one of the most common hazards drivers face and require careful observation, judgement, speed control and positioning.

Safe use of junctions relies on the MSM/PSL routine (Mirror, Signal, Manoeuvre)(Position, Speed, Look). Simple known as MSPSL (Mirror, Signal, Position, Speed, Look) together with the LADA routine (Look, Assess, Decide, Act) when observing.`
      },
      {
        heading: '2. Types of Junctions',
        body: `There are several common types of junctions you will encounter:

2.1 T-Junctions
• One road meets another in a "T" shape.
• You usually join a main road from a side road.
• May be controlled by Give Way or Stop signs and markings.

2.2 Crossroads
• Two roads cross each other.
• May be controlled (with lights or signs) or uncontrolled.
• Watch for oncoming traffic turning right and drivers who may misunderstand priority.

2.3 Roundabouts
• Circular junctions where traffic flows clockwise in the UK.
• Priority is normally given to traffic from the right.
• Lane discipline, signalling and observation are essential.

2.4 Staggered Junctions
• Side roads do not line up directly opposite each other.
• Follow lane markings carefully.
• Give way and position as required to avoid confusion.

2.5 Controlled Junctions
• Have traffic lights, Stop signs, Give Way signs or marked lanes.
• You must follow the signs, signals and road markings.

2.6 Uncontrolled (Unmarked) Junctions
• No signs or road markings to show priority.
• Approach with extra caution.
• No one has automatic priority – drivers must negotiate safely.`
      },
      {
        heading: '3. MSPSL Routine for Junctions',
        body: `The DVSA-approved routine for dealing with junctions is MSPSL:

• M – Mirrors
• S – Signal
• P – Position
• S – Speed
• L – Look (using the LADA routine)

This structure helps you plan your approach, communicate your intentions and handle the junction safely.`
      },
      {
        heading: '4. Mirrors',
        body: `Before you approach or turn at a junction, you must check your mirrors.

• Check the interior mirror to see what is directly behind you.
• Check the left door mirror when turning left.
• Check the right door mirror when turning right.

This helps you understand who is behind you, how close they are and whether your actions will affect them.`
      },
      {
        heading: '5. Signal',
        body: `Signal in good time so that other road users clearly understand your intentions.

• Signal left when turning left.
• Signal right when turning right.
• Avoid signalling too early, especially when there are several side roads close together.

A correct, well-timed signal helps others anticipate your actions and reduces the risk of confusion.`
      },
      {
        heading: '6. Position',
        body: `Correct positioning is essential for safe, clear junction use.

Turning Left
• Maintain your normal driving position: the centre of your lane.
• Do not drift unnecessarily towards the kerb.
• Stay in line with the flow of traffic.

Turning Right
• Position just left of the centre line of your road.
• Use any marked right-turn lane where provided.
• Leave room for oncoming traffic to pass safely.

Emerging from a Side Road
• Keep the car parallel to the kerb.
• Approach the Give Way or Stop line with your wheels straight.
• Do not steer into the new road until you are moving forward safely.`
      },
      {
        heading: '7. Speed',
        body: `You must approach junctions at a safe and controlled speed.

• Slow down early using progressive braking.
• Select the correct gear before turning (often 1st or 2nd gear depending on visibility and traffic).
• Be able to stop if necessary for traffic, pedestrians or unexpected hazards.

Entering a junction too fast is a common cause of loss of control and poor decision-making.`
      },
      {
        heading: '8. Look – Using the LADA Routine',
        body: `Instead of using a fixed pattern like "right–left–right", drivers should use the LADA routine:

L – Look
• Look in all directions that are relevant to the junction.
• Prioritise the direction of greatest potential danger based on the road layout.
• Scan for vehicles, cyclists, pedestrians and other hazards.

A – Assess
• Assess the speed and distance of approaching traffic.
• Consider road conditions, visibility and any obstructions.
• Assess whether vehicles are slowing, stopping or continuing.

D – Decide
• Decide whether it is safe to continue, to wait or to move forward slowly to gain a better view.
• Choose an appropriate gap in traffic if you are emerging or turning across traffic.

A – Act
• Carry out your decision calmly and smoothly.
• If it is safe, make the turn or emerge.
• If not safe, continue to wait and reassess.

LADA allows you to adapt your observations to each junction instead of relying on a rigid sequence.`
      },
      {
        heading: '9. Turning Left at a Junction',
        body: `When turning left at a junction:

Approach
• Check the interior and left door mirror.
• Signal left in good time.
• Maintain your normal driving position in the centre of your lane – do not hug the kerb.

At the Junction
• Reduce your speed early and select the correct gear.
• Use LADA to look, assess, decide and act.
• Watch for pedestrians crossing the road you are turning into and for cyclists on your left.

Turning
• Turn the steering wheel smoothly to follow the curve of the corner.
• Do not swing wide into the opposite lane.
• Adjust your speed as you join the new road and continue normal observations.`
      },
      {
        heading: '10. Turning Right at a Junction',
        body: `When turning right at a junction:

Approach
• Check mirrors and signal right.
• Position the car just left of the centre line or in the right-turn lane if provided.

At the Junction
• Slow down and select the appropriate gear.
• Use LADA to observe oncoming traffic, pedestrians and any vehicles behind that may attempt to overtake.

Turning
• Wait for a safe gap in oncoming traffic.
• Turn without cutting across the path of oncoming vehicles.
• Be aware of vehicles turning right from the opposite direction at crossroads.

Always be prepared to abandon the turn if a situation changes unexpectedly.`
      },
      {
        heading: '11. Emerging from a Junction',
        body: `Emerging means joining a main road from a side road.

Key points:
• Use the full MSPSL routine on approach.
• Use LADA for observation – look carefully in all relevant directions.
• Judge the speed and distance of traffic on the major road.
• Do not pull out if it causes other drivers to brake or change direction.
• Use 1st gear and the "creep and peep" technique if visibility is restricted.

Creep and peep means moving slowly forward while continuing to look until you can properly see into the new road.`
      },
      {
        heading: '12. Priority at Junctions',
        body: `Priority at junctions is determined by road signs, road markings, traffic lights and road layout.

General principles:
• Traffic on the main road usually has priority over side roads.
• At roundabouts, priority is normally given to traffic coming from the right.
• At Stop and Give Way signs, you must give priority to traffic on the major road.
• At unmarked junctions, no one has automatic priority – all drivers must proceed with great care.

Even if you appear to have priority, you must always be ready to slow down or stop if another road user makes a mistake.`
      },
      {
        heading: '13. Pedestrians and Vulnerable Road Users',
        body: `When dealing with junctions, you must always look out for pedestrians and other vulnerable road users.

Be especially aware of:
• Pedestrians crossing the road you are turning into.
• People stepping off the pavement near the corner.
• Children, elderly people and those with mobility difficulties.
• Cyclists and motorcyclists who may be less visible.

If pedestrians have started to cross the road you are turning into, you must give way.`
      },
      {
        heading: '14. Common Hazards at Junctions',
        body: `Common hazards you may encounter at junctions include:

• Parked vehicles blocking your view.
• Cyclists or motorcyclists in blind spots.
• Vehicles turning without signalling.
• Fast-moving traffic on the main road.
• Tight, sharp corners and awkward layouts.
• Poor weather or lighting conditions affecting visibility.

Always approach junctions expecting the unexpected and be prepared to stop.`
      },
      {
        heading: '15. Summary',
        body: `Safe use of junctions requires:

• Correct application of the MSPSL routine.
• Flexible and effective observation using LADA (Look, Assess, Decide, Act) instead of a fixed "right–left–right" pattern.
• Proper positioning, including maintaining the normal driving position (centre of your lane) when turning left.
• Good speed control and early gear selection.
• Clear understanding of priorities and road markings.
• Constant awareness of pedestrians, cyclists and other vulnerable road users.

By combining MSPSL with LADA, you can approach, assess and drive through junctions safely and confidently, in line with DVSA standards.`
      }
    ]
  },
  11: {
    title: 'Use of Speed',
    sections: [
      {
        heading: '1. Use of Speed – Overview',
        body: `Correct use of speed is essential for safe and responsible driving. Your choice of speed affects:
- Your stopping distance.
- Your ability to react to hazards.
- How much control you have over the vehicle.
- The safety of other road users.

Drivers must always travel at a speed that is safe, legal and appropriate for the road, traffic and weather conditions.

The speed limit is not a target – it is the maximum permitted in ideal conditions. You must use judgement to decide what speed is actually safe.`
      },
      {
        heading: '2. The Three Golden Rules of Speed',
        body: `2.1 Safe Speed
- Travel at a speed that allows you to stop safely within the distance you can see to be clear.

2.2 Legal Speed
- Never exceed the posted speed limit.
- Remember that limits vary by road type, vehicle type and local restrictions.

2.3 Appropriate Speed
- Even if the speed limit is high, conditions may require you to drive much slower.
- Reduce speed for:
  - Heavy traffic.
  - Rain, fog, ice or snow.
  - Poor visibility.
  - Narrow or winding roads.
  - Areas with pedestrians or cyclists.

Good drivers constantly adjust their speed to suit the situation.`
      },
      {
        heading: '3. Factors That Affect Your Speed Choice',
        body: `Your speed should always reflect the conditions around you.

3.1 Road Conditions
- Wet, icy or muddy roads.
- Poor or uneven road surfaces.
- Sharp bends and narrow roads.
- Roadworks and temporary road layouts.

Slippery or uneven roads require slower speeds.

3.2 Visibility
- Fog, heavy rain or spray.
- Darkness or low sun.
- Blind summits and sharp bends.
- Parked vehicles blocking your view.

If you cannot see clearly, you must reduce speed.

3.3 Traffic Conditions
- Heavy or slow-moving traffic.
- Pedestrians near or crossing the road.
- Cyclists or motorcyclists nearby.
- Large vehicles such as lorries or buses.
- School zones or busy town centres.

More hazards mean a lower, more cautious speed.

3.4 Vehicle Condition
- Tyre grip and tread depth.
- Braking performance.
- Weight of the vehicle and load.
- Mechanical issues or defects.

Poor vehicle condition reduces control and increases stopping distances.`
      },
      {
        heading: '4. Speed Limits',
        body: `Speed limits are set to promote safety based on road type, environment and typical hazards.

Common UK speed limits for cars (for guidance):
- 20 mph – Residential streets, school areas and some busy urban roads.
- 30 mph – Most built-up areas with street lighting (unless signed otherwise).
- 40 or 50 mph – Some urban or suburban main roads.
- 60 mph – National speed limit on single carriageways.
- 70 mph – National speed limit on dual carriageways and motorways.

Always look for:
- Speed limit signs.
- Changes in road type and environment.
- Street lights (which often indicate a 30 mph limit unless otherwise signed).

Remember: the correct speed may be below the limit if conditions require it.`
      },
      {
        heading: '5. Stopping Distances and Reaction Time',
        body: `Speed has a huge effect on how long it takes you to stop.

Stopping distance = Thinking distance + Braking distance

- Thinking distance is how far you travel while you react and move your foot to the brake.
- Braking distance is how far you travel from when you start braking until the car stops.

As speed increases:
- Thinking distance increases in a straight line with speed.
- Braking distance increases much more sharply (it can more than double).

For example (approximate figures in good conditions):
- At 30 mph, typical stopping distance is around 23 metres.
- At 60 mph, typical stopping distance is around 73 metres.

Wet, icy or poor road surfaces, worn tyres or poor brakes will all increase stopping distance.`
      },
      {
        heading: '6. Speed and Hazard Perception',
        body: `Safe drivers constantly scan for potential hazards and adjust their speed early.

You should reduce speed when you see:
- Pedestrians near or stepping onto the road.
- Cyclists, especially near junctions or roundabouts.
- Horses, agricultural vehicles or slow-moving traffic.
- Children playing near the pavement.
- Parked cars narrowing the road.
- Pedestrian crossings or school markings ahead.
- Busy junctions or roundabouts.

Slowing down in good time gives you more time to observe, think and react safely.`
      },
      {
        heading: '7. Speed When Approaching Hazards',
        body: `You must reduce your speed when approaching hazards such as:
- Junctions and roundabouts.
- Bends and sharp corners.
- Pedestrian crossings.
- Traffic queues.
- Narrow gaps or roadworks.
- Hidden dips, crests or blind summits.

Use a planned approach:
- Check mirrors early.
- Ease off the accelerator.
- Apply progressive braking.
- Select the correct gear before the hazard.

If in doubt, slow down – it is safer to approach slightly too slowly than too fast.`
      },
      {
        heading: '8. Acceleration and Smooth Driving',
        body: `Smooth acceleration and speed control make driving safer, more comfortable and more economical.

Good practice:
- Accelerate gently and progressively.
- Avoid harsh acceleration or sudden bursts of speed.
- Keep your speed steady where possible.
- Avoid frequent unnecessary braking by planning further ahead.

Smooth driving:
- Improves passenger comfort.
- Reduces fuel consumption and wear on the vehicle.
- Helps maintain better grip and stability, especially in poor weather.`
      },
      {
        heading: '9. Speed on Different Road Types',
        body: `Speed choice varies with the type of road you are using.

Urban Roads
- Many hazards such as pedestrians, cyclists, buses and parked cars.
- Expect frequent stops, junctions and crossings.
- Often safer to drive well below the limit, especially in busy or narrow streets.

Rural Roads
- May have higher limits but more hidden dangers.
- Expect sharp bends, blind summits, animals, tractors and uneven surfaces.
- It is often safer to drive well below the national speed limit.

Dual Carriageways and Motorways
- Designed for higher speeds.
- You must maintain larger gaps to vehicles in front.
- Stay within the speed limit and adjust speed for weather, visibility and traffic flow.`
      },
      {
        heading: '10. Speed and Following Distance',
        body: `Your speed is closely linked to how much space you need around your vehicle.

Use the two-second rule in good conditions:
- Watch the vehicle in front pass a fixed point (e.g. a sign or lamppost).
- Say "Only a fool breaks the two-second rule" at a normal pace.
- If you pass the same point before you finish the phrase, you are too close.

In poor conditions:
- Double the gap in rain or when the road is wet.
- Multiply by 10 in snow or ice.

Following too closely reduces your time to react and greatly increases the risk of a collision.`
      },
      {
        heading: '11. Summary',
        body: `Safe use of speed means:

- Never exceeding the legal speed limit.
- Always adjusting speed to match weather, traffic and road conditions.
- Using smooth acceleration and controlled braking.
- Leaving enough time and distance to react to hazards.
- Reducing speed early when hazards increase, such as at junctions, crossings and bends.
- Understanding that higher speed greatly increases stopping distance and the severity of collisions.

A good driver always chooses the right speed for the situation, not simply the maximum allowed by the speed limit.`
      }
    ]
  },
  12: {
    title: 'Meeting and Dealing With Other Traffic',
    sections: [
      {
        heading: '1. Meeting and Dealing With Other Traffic – Overview',
        body: `When driving, you will regularly meet oncoming vehicles, overtake slower traffic, pass parked cars and negotiate narrow roads. Safe interaction with other road users is essential to avoid collisions, keep traffic flowing and demonstrate good judgement.

Meeting traffic safely requires:
- Good observation.
- Anticipation.
- Clear communication.
- Correct positioning.
- Appropriate use of speed.

This is especially important on narrow roads, in busy urban areas, on rural lanes and wherever space is limited.`
      },
      {
        heading: '2. Key Principles When Meeting Other Traffic',
        body: `2.1 Be Prepared to Give Way
- Even if you believe you have priority, you must be ready to slow down, move to the left or stop.
- Cooperation keeps everyone safe and helps avoid confrontation.

2.2 Use Good Observation
- Look well ahead for oncoming vehicles and potential hazards.
- Watch for parked cars narrowing the road.
- Look for pedestrians, cyclists and animals.
- Check for road narrowing signs, traffic calming measures and blind bends.

2.3 Anticipate the Actions of Others
- Expect vehicles to appear suddenly on narrow or rural roads.
- Anticipate pedestrians stepping out from between parked cars.
- Allow for cyclists wobbling or moving away from the kerb.
- Be prepared for other drivers misjudging gaps or speed.

2.4 Keep an Appropriate Speed
- Avoid driving too fast for the conditions.
- Drive slowly enough that you can stop safely if needed.
- Slower speeds give you more time to think and react when meeting other traffic.`
      },
      {
        heading: '3. Meeting Traffic on Narrow Roads',
        body: `Narrow roads require extra care, patience and cooperation.

3.1 Use Passing Places
- On rural or single-track roads, use designated passing places to allow oncoming vehicles to pass.
- Pull into a passing place on your left when safe.
- If the passing place is on your right, wait opposite it rather than crossing the road.
- Acknowledge other drivers who give way with a simple hand gesture or nod.

3.2 Give Way if You Reach the Obstruction First
- If parked vehicles or roadworks narrow the road, the driver who reaches the obstruction first should normally give way.
- The driver with a clear path has priority, but both drivers should be prepared to cooperate.
- Do not force your way through tight gaps.

3.3 Priority Signs
- Look for signs showing priority:
  - "Priority over oncoming traffic".
  - "Give priority to oncoming traffic".
- Obey the signs, even if other drivers do not.
- Always proceed with caution.`
      },
      {
        heading: '4. Passing Parked Cars and Static Hazards',
        body: `Parked vehicles and other static hazards often reduce road width and create potential conflicts with oncoming traffic.

4.1 Use MSM and PSL
- Mirrors: Check behind to see if anyone is following or overtaking.
- Signal: Indicate if it will help or inform other road users.
- Position: Move out gradually to give space from parked cars.
- Speed: Slow down if visibility or space is limited.
- Look: Scan ahead for oncoming vehicles, pedestrians and cyclists.

4.2 Maintain a Safety Margin
- Leave enough room from parked cars to allow for doors opening suddenly.
- Watch for pedestrians, especially children, stepping out between vehicles.

4.3 Avoid Forcing Oncoming Traffic to Brake
- If oncoming traffic is approaching and there is not enough room for both, slow down or stop and let them pass first.
- Be prepared to wait behind parked cars to create a safe passing gap.

4.4 Watch for Vulnerable Road Users
- Look for cyclists filtering between parked vehicles.
- Look for people loading or unloading vehicles.
- Take extra care near schools, shops and bus stops.`
      },
      {
        heading: '5. Dealing With Oncoming Traffic',
        body: `5.1 Judge the Space Early
- Look well ahead to assess whether there is enough room for you and an oncoming vehicle to pass safely.
- Decide early whether you need to slow, move left or stop.

5.2 Adjust Your Position
- Move closer to the left where safe to create more space between you and oncoming traffic.
- Avoid driving too close to the kerb or drains.
- Do not attempt to squeeze through gaps that are too small.

5.3 Communicate Clearly
- Use signals only when they are necessary and helpful.
- Use gentle hand gestures or eye contact (where appropriate) to acknowledge other drivers.
- Do not flash your headlights or wave people on if you are not sure it is safe – this can confuse or mislead other road users.

Staying calm and patient will help you share the road safely.`
      },
      {
        heading: '6. Overtaking and Passing Slower Traffic',
        body: `Overtaking and passing slower traffic must be done with great care.

6.1 Before Overtaking – MSM and LADA
- Check mirrors to see what is behind.
- Signal if it will help or inform others.
- Use LADA (Look, Assess, Decide, Act):
  - Look ahead for oncoming traffic and hazards.
  - Assess whether the road is long and clear enough.
  - Decide if it is safe to overtake.
  - Act only when fully safe.

6.2 Assess the Road Ahead
- Do not overtake if there is:
  - A bend ahead.
  - A junction nearby.
  - A hidden dip or hill crest.
  - Oncoming traffic too close.
  - Solid white lines or other restrictions.

6.3 Overtake Only When Safe
- Give plenty of space when passing another vehicle.
- Complete the overtake smoothly.
- Move back into lane only when you can see the vehicle you have overtaken in your interior mirror.

6.4 Overtaking Cyclists
- Allow at least 1.5 metres when overtaking cyclists at speeds up to 30 mph.
- Leave more space at higher speeds.
- Be patient and wait for a safe opportunity if the road is narrow.`
      },
      {
        heading: '7. Dealing With Large Vehicles',
        body: `Large vehicles such as buses and lorries need more room to manoeuvre and take longer to stop.

7.1 Give Them Space
- Do not cut in front of large vehicles after overtaking.
- Leave extra stopping distance when following them.
- Expect them to swing out wide, particularly when turning left.

7.2 Be Cautious When Overtaking
- Large vehicles can hide oncoming traffic from view.
- You need a longer, completely clear stretch of road to overtake safely.
- Never overtake near junctions, bends or hill crests.`
      },
      {
        heading: '8. Meeting Pedestrians, Cyclists and Horses',
        body: `Vulnerable road users require extra care, especially when road space is shared.

8.1 Pedestrians
- Slow down when pedestrians are close to the road.
- Be prepared to stop if they step out unexpectedly.

8.2 Cyclists
- Give cyclists plenty of room when passing.
- Do not squeeze past in narrow spaces.
- Be patient, especially near junctions, roundabouts and on narrow roads.

8.3 Horses
- Pass horses very slowly and give them a wide berth.
- Avoid revving the engine or sounding the horn.
- Follow any signals given by the rider if safe to do so.`
      },
      {
        heading: '9. Summary',
        body: `Meeting and dealing with other traffic is about sharing the road safely and respectfully.

To do this well, you must:
- Observe early and look well ahead for hazards.
- Adjust your speed to allow safe passing and stopping.
- Use the MSM routine (Mirror, Signal, Manoeuvre) and LADA (Look, Assess, Decide, Act).
- Cooperate with other drivers by giving way when necessary.
- Maintain safe space around your vehicle, especially near parked cars and narrow roads.
- Take extra care around vulnerable road users such as pedestrians, cyclists and horse riders.

Good judgement and calm, considerate behaviour are essential for meeting and dealing with other traffic safely and for passing the DVSA practical test.`
      }
    ]
  },
  13: {
    title: 'Crossroads',
    sections: [
      {
        heading: '1. Crossroads – Overview',
        body: `A crossroads is a junction where two roads cross each other. Crossroads can be controlled or uncontrolled, simple or complex, and they require strong observation, clear signalling, correct positioning and the use of both MSM and MSPSL routines.

Because several streams of traffic can meet at the same point, crossroads are considered one of the more challenging junction types for learners.

Safe driving at crossroads involves:
- Knowing who has priority.
- Using effective observation (LADA).
- Placing the vehicle correctly.
- Timing signals properly.
- Judging safe gaps in traffic.`
      },
      {
        heading: '2. Types of Crossroads',
        body: `2.1 Controlled Crossroads
- Controlled by traffic lights, Stop signs, Give Way signs or clear road markings.
- You must obey signals and markings, even if other drivers do not.

2.2 Uncontrolled (Unmarked) Crossroads
- No signs or road markings to show priority.
- No one has automatic priority.
- Drivers must slow down, observe carefully and proceed only when it is clearly safe.

2.3 Marked Priority Crossroads
- Signs and markings show a major road and one or more minor roads.
- Traffic on the major road normally has priority.
- Drivers on minor roads must give way, as indicated by signs and lines.

2.4 Staggered Crossroads
- The side roads do not line up directly opposite each other.
- May be staggered left–right or right–left.
- Follow lane markings carefully and give way where required.
- Take extra care not to cut across oncoming traffic when crossing from one side road to another.`
      },
      {
        heading: '3. MSM and MSPSL at Crossroads',
        body: `Crossroads require careful use of both MSM and MSPSL routines.

MSM – Mirror, Signal, Manoeuvre
- Use the MSM routine whenever you approach a crossroads, change lanes or turn left or right.
- Mirrors: Check interior and appropriate door mirrors to see what is behind and alongside.
- Signal: Signal in good time if it will help or inform others.
- Manoeuvre: Carry out your intended action only when it is safe.

MSPSL – Mirror, Signal, Position, Speed, Look
- At crossroads, break the Manoeuvre stage into MSPSL for more detailed control:
  - Mirror – Check mirrors on approach.
  - Signal – Indicate your intentions early enough.
  - Position – Move into the correct lane or position for going ahead, turning left or turning right.
  - Speed – Slow down in good time and select the correct gear.
  - Look – Use the LADA routine (Look, Assess, Decide, Act) to check all directions before proceeding.

MSM gives you the overall structure; MSPSL helps you manage the details of the manoeuvre at crossroads.`
      },
      {
        heading: '4. Observations at Crossroads – Using LADA',
        body: `Crossroads require wider and more flexible observation than simple T-junctions because traffic can come from ahead, behind, both sides and diagonally.

Use LADA – Look, Assess, Decide, Act:

L – Look
- Look in all directions that are relevant to the crossroads.
- Do not rely on a fixed pattern – look where danger is greatest first.
- Scan for:
  - Oncoming traffic turning right.
  - Vehicles emerging from minor roads.
  - Pedestrians crossing in any direction.
  - Cyclists and motorcyclists near the junction.

A – Assess
- Assess who has priority from the signs and markings.
- Assess the speed and distance of approaching traffic.
- Consider visibility, road layout and any obstructions.

D – Decide
- Decide whether it is safe to proceed, whether you should wait or whether you need to move slightly forward to improve your view (creep and peep).
- Choose a safe gap in the traffic if you are crossing or turning.

A – Act
- Carry out your decision calmly and smoothly.
- If it is safe, complete the turn or go ahead through the crossroads.
- If not safe, hold back and reassess.

LADA helps you adapt your observation to each specific crossroads rather than using a rigid fixed sequence.`
      },
      {
        heading: '5. Turning Right at Crossroads',
        body: `Right turns at crossroads can be challenging because your path often crosses the path of oncoming traffic.

5.1 Offside-to-Offside Turning (Most Common and Safer)
- The two right-turning vehicles turn behind each other.
- This usually provides a clear view of oncoming traffic.
- Commonly used where road markings or layout support this method.

5.2 Nearside-to-Nearside Turning
- The two right-turning vehicles turn in front of each other.
- This may be required by markings or road design.
- It can reduce your view of oncoming traffic and make judging other vehicles' movements more difficult.

When turning right at crossroads:
- Use MSM and MSPSL on approach.
- Position correctly for the right turn.
- Use LADA to observe oncoming traffic, vehicles opposite that are also turning, and pedestrians.
- Do not commit to the turn until you are sure the path is clear and it is safe.`
      },
      {
        heading: '6. Going Ahead at a Crossroad',
        body: `Even when going straight ahead at a crossroads, you must not assume it is automatically safe.

- Use MSM and MSPSL on approach.
- Observe carefully using LADA:
  - Look for vehicles emerging from side roads.
  - Check for vehicles on the opposite side turning right across your path.
  - Watch for pedestrians crossing either road.
- Be ready to slow down or stop if another road user makes an unexpected move.

Going straight ahead can still carry risk, especially at unmarked or complex crossroads.`
      },
      {
        heading: '7. Turning Left at Crossroads',
        body: `Turning left at a crossroads should still be treated with care.

Approach
- Use MSM: check mirrors and signal left in good time.
- Maintain your normal driving position in the centre of your lane.

At the Crossroad
- Reduce your speed and select the correct gear.
- Use LADA to look for:
  - Pedestrians crossing the road you are turning into.
  - Cyclists on your left.
  - Vehicles on the major road.

Turn
- Turn into the new road without cutting the corner or drifting wide.
- Check your mirrors after the turn and continue to adjust your speed as needed.`
      },
      {
        heading: '8. Priority at Crossroads',
        body: `Priority at crossroads depends on road signs, road markings, traffic lights and the layout of the roads.

General rules:
- Follow traffic lights, Stop signs and Give Way markings.
- Traffic on the major road usually has priority over side roads.
- At unmarked crossroads, no one has automatic priority – all drivers must proceed with great caution.
- Never assume that other drivers will follow the rules.

Even if you appear to have priority, you must always be prepared to slow down or stop if another road user behaves unexpectedly.`
      },
      {
        heading: '9. Common Hazards at Crossroads',
        body: `Common hazards at crossroads include:

- Drivers failing to signal or signalling incorrectly.
- Vehicles turning right across your path unexpectedly.
- Cyclists and motorcyclists approaching from blind spots.
- Pedestrians crossing diagonally across the junction.
- Parked vehicles reducing visibility near the junction.
- Vehicles emerging from minor roads without stopping.

You must reduce your speed on approach, observe carefully and be ready to react to any of these hazards.`
      },
      {
        heading: '10. Hesitation and Stalling at Crossroads',
        body: `If you feel unsure at a crossroads, it is safer to wait and reassess.

- Do not move into the junction unless you are sure it is safe.
- If visibility is poor, use "creep and peep" to improve your view while staying in control.

If the engine stalls:
- Stay calm.
- Apply the handbrake if necessary.
- Restart the engine safely.
- Reapply MSM and MSPSL before attempting to move off again.

Examiners look for safe decisions more than speed of decision-making.`
      },
      {
        heading: '11. Summary',
        body: `Safe use of crossroads requires:

- Correct use of MSM (Mirror, Signal, Manoeuvre) on approach.
- Detailed control using MSPSL (Mirror, Signal, Position, Speed, Look).
- Flexible and effective observation using LADA (Look, Assess, Decide, Act).
- Understanding of different crossroads layouts and priority rules.
- Careful judgement of gaps when turning right or crossing traffic.
- Awareness of hazards from all directions.

By applying MSM, MSPSL and LADA together, you can approach and drive through crossroads safely and confidently in line with DVSA standards.`
      }
    ]
  },
  14: {
    title: 'Roundabouts',
    sections: [
      {
        heading: '1. Roundabouts – Overview',
        body: `Roundabouts allow traffic from multiple roads to merge, cross or change direction without necessarily stopping. They improve traffic flow and reduce the severity of collisions but require strong observation, lane discipline and correct use of signals.

The key rule is:
- Give priority to traffic approaching from your immediate right, unless road signs, traffic lights or markings indicate otherwise.

Roundabouts vary in size and complexity, from mini roundabouts to large multi-lane or signal-controlled roundabouts. On all of them you must use MSM (Mirror, Signal, Manoeuvre), MSPSL (Mirror, Signal, Position, Speed, Look) and LADA (Look, Assess, Decide, Act).`
      },
      {
        heading: '2. Priority at Roundabouts',
        body: `2.1 Standard Priority Rule
- Before you enter a roundabout, you normally give way to traffic approaching from your immediate right.
- You should keep moving if the way is clear and it is safe to do so, rather than stopping unnecessarily.

2.2 When Priority May Change
In some cases, the usual rule changes:
- There may be Give Way signs or lines on the roundabout itself, requiring traffic already on the roundabout to give way to entering traffic.
- Traffic lights (sometimes part-time) may control priority.
- Lane priority arrows or markings may give priority to certain lanes.

Always obey:
- Road signs.
- Road markings.
- Traffic signals.

These override the normal "give way to the right" rule.`
      },
      {
        heading: '3. MSM and MSPSL on Approach',
        body: `Approaching a roundabout requires early planning and correct use of routines.

MSM – Mirror, Signal, Manoeuvre
- Mirror – Check interior and door mirrors early to see what is behind and alongside you.
- Signal – Indicate your intentions if it will help other road users.
- Manoeuvre – This is broken down further using MSPSL.

MSPSL – Mirror, Signal, Position, Speed, Look
- Mirror – Check again as you get closer.
- Signal – Use the correct signal for your intended exit (see later sections).
- Position – Choose the correct approach lane in good time and avoid straddling lanes.
- Speed – Slow down progressively and select the right gear (often 2nd gear, sometimes 1st if very busy).
- Look – Use the LADA routine to judge whether it is safe to enter.

Always use MSM and MSPSL when approaching any roundabout.`
      },
      {
        heading: '4. Approaching a Roundabout',
        body: `On approach:
- Look well ahead for advance warning signs showing the layout of the roundabout and the exits.
- Use the sign and any lane diagrams or route numbers to select the most suitable lane.
- Look for lane direction arrows on the road surface.

Key points:
- Get into the correct lane in good time.
- Do not straddle lanes.
- Avoid changing lanes at the last moment.
- Where possible, look across the roundabout and identify the exit you intend to take so you can plan your path through safely.`
      },
      {
        heading: '5. Observation at Roundabouts – LADA',
        body: `Because traffic comes from several directions, strong and flexible observation is essential.

Use LADA – Look, Assess, Decide, Act:

L – Look
- Look to the right to check for traffic already on the roundabout.
- Look ahead for vehicles circulating or changing lanes.
- Look left for vehicles or pedestrians near your entry and exit points.
- Look across the roundabout to anticipate movements that may affect your exit.

A – Assess
- Assess the speed and distance of approaching traffic.
- Assess the size of gaps.
- Note lane markings and signals.
- Look out for vulnerable road users (cyclists, motorcyclists, pedestrians).

D – Decide
- Decide whether it is safe to enter.
- Decide if you need to adjust speed or wait.
- Decide which lane you must be in to follow your route.

A – Act
- If safe, enter smoothly and maintain lane discipline.
- If not safe, hold back at the give way line and reassess.

Never rush the decision to enter a roundabout – it must always be based on careful observation and assessment.`
      },
      {
        heading: '6. Lane Selection and General Procedure',
        body: `Unless signs or road markings say otherwise, use these general rules:

Turning Left (First Exit)
- Signal left on approach.
- Approach in the left-hand lane.
- Keep in the left lane on the roundabout.
- Maintain your left signal through the roundabout until you exit.

Going Straight Ahead
- No signal is normally required on approach.
- Approach in the left-hand lane. If this is blocked, use the lane next to it if permitted.
- Keep to your selected lane on the roundabout.
- As you pass the exit just before the one you intend to take:
  - Check your interior and left door mirrors.
  - Signal left.
- Exit smoothly.

Turning Right or Going Full Circle
- Signal right as you approach.
- Approach in the right-hand lane.
- Keep to that lane on the roundabout and maintain your right signal.
- As you pass the exit just before the one you intend to take:
  - Check your interior and left door mirrors.
  - Signal left.
- Move left only when it is safe and exit.

More Than Three Lanes
- Where there are more than three lanes, use the most appropriate lane for your intended exit based on signs and road markings.
- Follow lane arrows and markings exactly.

Important: When using the right-hand lane to go ahead or turn right, be especially aware of traffic in the lane to your left, as they may change lane or leave unexpectedly.`
      },
      {
        heading: '7. Defensive Driving on Roundabouts',
        body: `Defensive driving means anticipating errors by other road users and protecting yourself.

On roundabouts:
- Watch the vehicle in front carefully as you are about to enter.
- Do not assume that the driver ahead will keep moving – they may stop suddenly while you are still looking to the right.
- Many rear-end collisions occur because the following driver assumes the vehicle ahead will continue.
- Make sure the vehicle in front has actually moved away and the space is clear before you commit to moving.

Stay calm, patient and prepared to wait for a safer gap if needed.`
      },
      {
        heading: '8. Hazards at Roundabouts',
        body: `Roundabouts can be particularly hazardous. While negotiating them, take extra care to watch for:

- Pedestrians: crossings are often located near the entrances and exits. Even where there are no formal crossings, pedestrians may try to cross the road at the junction.
- Cyclists and horse riders: they may stay in the left lane even when turning right. Allow them plenty of room and do not cut across their path.
- Motorcyclists and cyclists: they can be difficult to see, especially when they are in blind spots or moving between lanes.
- Long vehicles: because of their length, they may take a different line or straddle lanes on approach and while going round. Watch their signals and allow for the path of the rear of the vehicle.
- All vehicles: be prepared for others to cross your path when leaving by the next exit. Always look for signals and position changes.
- Road surface: road surfaces can be polished and slippery, especially when wet. Avoid harsh braking or sharp acceleration while on the roundabout.`
      },
      {
        heading: '9. Mini Roundabouts',
        body: `Mini roundabouts should be approached in the same way as larger roundabouts:
- Slow down.
- Be prepared to give way to traffic from the right.

However, mini roundabouts give you less time and space to signal and manoeuvre.

Key points:
- Vehicles coming towards you may want to turn right – you must give way to them if they are on your right.
- Make sure any vehicle already on the roundabout is actually leaving it before you join.
- Beware of drivers using the mini roundabout to perform a U-turn.
- You must drive around the central markings unless you are driving a large vehicle or towing a trailer that cannot do so.
- Try to avoid making a U-turn yourself, but be aware others may do this.

Always treat mini roundabouts with extra care and reduce your speed accordingly.`
      },
      {
        heading: '10. Double Mini Roundabouts',
        body: `At double mini roundabouts, two or more mini roundabouts are placed close together.

- Treat each mini roundabout separately.
- At each one, give way to traffic from your right.
- Take careful all-round observation before entering each roundabout.
- Look well ahead for direction signs to help you position correctly and choose the correct lane.

Because decisions must be made quickly, you must stay calm, plan ahead and use LADA at each stage.`
      },
      {
        heading: '11. Spiral Roundabouts',
        body: `Spiral roundabouts differ from standard roundabouts because the lanes spiral outwards and each lane is usually marked for a specific exit.

On spiral roundabouts:
- Make sure you are in the correct lane before you enter the roundabout.
- Follow the lane arrows and road markings to your exit – do not cut across lanes.
- Be aware that some drivers may try to move into your lane unexpectedly.

If you need to change lanes:
- Check mirrors and blind spots carefully.
- Signal if it will help or inform others.
- Change lane smoothly only when it is clearly safe.

If you follow the spiral lanes and markings correctly, they will guide you safely to the appropriate exit.`
      },
      {
        heading: '12. Multiple Roundabout Systems',
        body: `At some complex junctions, a large roundabout may incorporate a series of mini roundabouts at the intersections.

- Each mini roundabout follows the normal rules, with traffic travelling clockwise.
- Traffic moving around the central route may appear to flow differently depending on the design.
- Lanes, signs and road markings give directions, but these junctions require a high level of care and concentration.

Look for direction signs well in advance, choose the correct lane early and use MSM, MSPSL and LADA throughout.`
      },
      {
        heading: '13. Summary',
        body: `To use roundabouts safely and confidently you must:

- Apply MSM and MSPSL on every approach.
- Use LADA (Look, Assess, Decide, Act) for all observation and decision-making.
- Get into the correct lane in good time and avoid last-minute changes.
- Give way to traffic from the right unless signs, markings or signals say otherwise.
- Signal correctly on approach and when exiting.
- Maintain lane discipline and adjust your speed to the flow of traffic.
- Take extra care around pedestrians, cyclists, motorcyclists, horse riders and large vehicles.

Roundabouts are a key part of everyday driving and a major focus of the DVSA practical test. Mastering them shows that you can plan ahead, cooperate with others and drive safely in complex traffic situations.`
      }
    ]
  },
  15: {
    title: 'Dual Carriageways',
    sections: [
      {
        heading: '1. Dual Carriageways – Overview',
        body: `A dual carriageway is a road where traffic travelling in opposite directions is separated by a central reservation. This separation allows traffic to move at higher speeds, but it also means decisions must be made earlier and with greater awareness.

Dual carriageways can include:
• Two or more lanes in each direction.
• Slip roads for joining and leaving.
• Central barriers or grassed reservations.
• Traffic lights, roundabouts or junctions.

Driving safely on dual carriageways requires good planning, correct lane discipline, effective observation and confident speed control.`
      },
      {
        heading: '2. Key Characteristics of Dual Carriageways',
        body: `Dual carriageways typically have:
• A central reservation separating traffic in opposite directions.
• Higher speed limits than many single carriageways.
• Slip roads for joining and leaving (in many cases).
• Faster-moving traffic and larger speed differences between vehicles.

Always drive to the conditions, not just the speed limit.`
      },
      {
        heading: '3. Speed Limits on Dual Carriageways',
        body: `For cars, the national speed limit on a dual carriageway is usually:
• 70 mph, unless signs show a lower limit.

Lower limits may apply:
• Near roadworks.
• In poor weather.
• At busy junctions or urban sections.
• For certain vehicles (e.g. some vans, towing vehicles and lorries).

Always obey speed limit signs and choose a speed that is safe for traffic, road and weather conditions.`
      },
      {
        heading: '4. Joining a Dual Carriageway (Using a Slip Road)',
        body: `Most dual carriageways are joined via a slip road.

4.1 On the Slip Road
• Use MSM and MSPSL early.
• Accelerate positively to match the speed of traffic on the dual carriageway.
• Use the full length of the slip road if needed.
• Check mirrors frequently.

4.2 Observation and Judgement (Using LADA)
• Look for a suitable gap in the traffic.
• Assess the speed and distance of vehicles in the left lane.
• Decide whether to speed up or slow slightly to fit into a safe gap.
• Act smoothly when safe.

Traffic already on the dual carriageway normally has priority.

4.3 Merging
• Signal right if it will help other drivers.
• Merge smoothly without forcing others to brake or change lanes.
• Do not stop on the slip road unless absolutely necessary.`
      },
      {
        heading: '5. Joining from a Side Road (No Slip Road)',
        body: `Some dual carriageways have junctions where you join directly from a side road.

Key points:
• Use MSM and MSPSL.
• Stop at the give way or stop line if required.
• Judge traffic speed carefully – vehicles may approach very quickly.
• Use LADA to assess both directions and both carriageways.
• Only emerge when there is a large, safe gap.

Never assume traffic will slow down for you.`
      },
      {
        heading: '6. Lane Discipline on Dual Carriageways',
        body: `6.1 Normal Driving Position
• Drive in the left-hand lane unless overtaking.

6.2 Overtaking
• Use the right-hand lane(s) for overtaking.
• Return to the left lane once you have safely passed.
• Do not stay in the right lane unnecessarily.

6.3 Lane Changes
• Apply MSM:
  • Mirrors: check interior and door mirror.
  • Signal: if it benefits other road users.
  • Manoeuvre: move smoothly when safe.

Always check blind spots, especially at higher speeds.`
      },
      {
        heading: '7. Driving at Higher Speeds',
        body: `Higher speeds reduce reaction time and increase stopping distances.

Safe driving at speed includes:
• Maintaining a safe following distance (at least 2 seconds).
• Increasing distance in rain, fog or poor conditions.
• Scanning well ahead for hazards.
• Avoiding harsh braking and sudden steering.

Smooth, early decisions are essential on dual carriageways.`
      },
      {
        heading: '8. Leaving a Dual Carriageway (Using a Slip Road)',
        body: `8.1 Planning to Leave
• Look well ahead for direction signs.
• Move into the correct lane early.
• Check mirrors and signal left.

8.2 On the Exit Slip Road
• Do not slow down on the main carriageway.
• Reduce speed only after you have entered the slip road.
• Be prepared for lower speed limits, sharp bends, traffic lights or roundabouts.

Leaving too late or braking on the main carriageway can be dangerous, so plan early.`
      },
      {
        heading: '9. Leaving a Dual Carriageway (No Slip Road)',
        body: `Some exits require turning directly off the dual carriageway without a slip road.

Key points:
• Use MSM and MSPSL.
• Signal early.
• Position correctly for the turn.
• Reduce speed gradually and in good time.
• Be aware that vehicles behind may not expect you to slow.

Take extra care because traffic behind may be travelling at higher speeds.`
      },
      {
        heading: '10. Turning Right on a Dual Carriageway',
        body: `Right turns across a dual carriageway are hazardous and less common.

If required:
• Use designated gaps in the central reservation.
• Cross one carriageway at a time.
• Stop in the central reservation if needed and safe.
• Use LADA before crossing each lane.

Never rush a right turn. Wait for safe gaps in both directions and do not force other vehicles to slow down.`
      },
      {
        heading: '11. Hazards on Dual Carriageways',
        body: `Be alert for:
• Fast-moving traffic and vehicles travelling at different speeds.
• Vehicles joining and leaving suddenly via slip roads.
• Lane closures, roadworks and temporary speed limits.
• Breakdowns and vehicles stopped on the hard shoulder.
• Poor weather affecting visibility and grip.
• Driver fatigue on long journeys.

Early observation and anticipation reduce risk.`
      },
      {
        heading: '12. Breakdowns and Emergencies',
        body: `If you break down on a dual carriageway:
• Move onto the hard shoulder if there is one.
• Stop as far left as possible.
• Switch on hazard warning lights.
• Exit the vehicle safely if necessary and keep well away from the carriageway.

Follow any local guidance and call for assistance. Your priority is to keep yourself and passengers safe.`
      },
      {
        heading: '13. Summary',
        body: `Safe driving on dual carriageways requires:
• Good planning and early observation.
• Correct use of MSM, MSPSL and LADA.
• Matching speed when joining.
• Strong lane discipline and safe overtaking.
• Leaving safely using slip roads and planning early.
• Maintaining safe following distances.
• Anticipating hazards at higher speeds.

Dual carriageways demand confidence, awareness and cooperation with other road users. Mastering them is essential for safe everyday driving and success in the DVSA practical test.`
      }
    ]
  },
  16: {
    title: 'Country Roads',
    sections: [
      {
        heading: '1. Country Roads – Overview',
        body: `Country roads are often narrow, winding and unpredictable. Although speed limits may be higher than in built-up areas, country roads usually contain more hidden hazards and require a high level of anticipation, observation and control.

Driving safely on country roads depends on:
• Good planning.
• Accurate observation.
• Correct positioning.
• Appropriate use of speed.
• Smooth vehicle control.

Always remember: the national speed limit does not mean it is safe to drive at that speed.`
      },
      {
        heading: '2. Key Characteristics of Country Roads',
        body: `Country roads commonly include:
• Narrow lanes with little or no road markings.
• Sharp bends and blind corners.
• Hedges, trees or walls restricting visibility.
• Changes in road width.
• Uneven or poor road surfaces.
• Limited lighting or no street lighting.
• Agricultural traffic and animals.

Because visibility is often limited, you must be able to stop safely within the distance you can see to be clear.`
      },
      {
        heading: '3. Speed on Country Roads',
        body: `3.1 Speed Limits
• Many country roads have the national speed limit (often 60 mph for cars) unless signs show otherwise.
• This is the maximum legal speed, not a target.

3.2 Choosing the Right Speed
Reduce speed when:
• Visibility is limited.
• Roads are narrow or winding.
• There are bends, hills or dips.
• Weather conditions are poor.
• You are meeting oncoming traffic.
• Pedestrians, cyclists or animals are present.

Always adjust your speed so you can stop safely.`
      },
      {
        heading: '4. Positioning on Country Roads',
        body: `4.1 Normal Driving Position
• Keep to the left-hand side of the road but not too close to the verge or edge.
• Maintain a position that gives you good visibility and a safety margin.

4.2 Approaching Bends
• On right-hand bends, position slightly away from the centre line to reduce the risk of conflict with oncoming vehicles.
• On left-hand bends, you may position slightly more towards the centre of your lane to improve your view, without crossing the centre line.
• Slow down before the bend, not during it.

Correct positioning improves visibility and reduces risk.`
      },
      {
        heading: '5. Observation and Anticipation (Using LADA)',
        body: `Country roads require constant scanning and anticipation.

L – Look
Look well ahead for:
• Oncoming vehicles.
• Sharp bends and junctions.
• Hidden dips or crests.
• Mud, water or gravel on the road.
• Animals or farm vehicles.
• Pedestrians or cyclists.

A – Assess
Assess:
• How much you can see and whether you can stop safely.
• Road width and surface grip.
• Speed of oncoming traffic.
• Safe places to pull in if needed.

D – Decide
Decide whether to:
• Reduce speed.
• Adjust position.
• Stop or give way.
• Use a passing place.

A – Act
Act smoothly and early:
• Brake progressively.
• Steer gently.
• Use passing places calmly when needed.`
      },
      {
        heading: '6. Meeting Oncoming Traffic',
        body: `Many country roads are too narrow for two vehicles to pass easily.

Key points:
• Slow down early.
• Be prepared to stop.
• Use passing places to allow vehicles to pass.
• If a passing place is on your left, pull in when safe.
• If a passing place is on your right, wait opposite it rather than crossing the road.
• Avoid mounting verges unless unavoidable.

Cooperation and patience are essential.`
      },
      {
        heading: '7. Passing Parked or Slow-Moving Vehicles',
        body: `When passing parked vehicles or slow-moving traffic:
• Check mirrors.
• Reduce speed.
• Allow extra space.
• Be ready to stop if oncoming traffic appears.

Watch for:
• Parked vehicles near farm entrances.
• Tractors and agricultural machinery.
• Horses, cyclists and pedestrians.

Never force your way through a tight gap.`
      },
      {
        heading: '8. Bends, Hills and Blind Spots',
        body: `8.1 Bends
• Reduce speed before entering.
• Stay in your lane.
• Expect oncoming vehicles to take more space on bends.

8.2 Hills and Crests
• Slow down as visibility reduces.
• Be prepared for vehicles, cyclists, animals or hazards just beyond the crest.

Never overtake where you cannot see clearly ahead.`
      },
      {
        heading: '9. Overtaking on Country Roads',
        body: `Overtaking on country roads is often risky due to limited visibility.

Only overtake if:
• The road ahead is long, straight and completely clear.
• There are no bends, junctions, dips or crests ahead.
• Road markings allow overtaking.
• You can complete the manoeuvre safely and quickly.

If in doubt, do not overtake.`
      },
      {
        heading: '10. Dealing With Animals',
        body: `Animals may appear suddenly on country roads.

Be prepared for:
• Livestock crossing the road.
• Horses being ridden or led.
• Wildlife such as deer, sheep or farm animals.

If you see animals:
• Slow down.
• Be prepared to stop.
• Do not sound the horn aggressively.
• Pass slowly and give plenty of space.`
      },
      {
        heading: '11. Road Surface Hazards',
        body: `Country roads may contain hazards that reduce grip, including:
• Mud from farm vehicles.
• Wet leaves.
• Loose gravel.
• Standing water.
• Ice in shaded areas.

Brake and steer gently to avoid skidding. Harsh braking or sharp steering on poor surfaces increases the risk of losing control.`
      },
      {
        heading: '12. Weather and Light Conditions',
        body: `Weather and light conditions can affect country roads more severely:
• Fog can appear suddenly.
• Roads dry slowly after rain.
• Ice forms earlier and lasts longer on rural roads.
• Poor lighting makes hazards harder to see.

Adjust your speed and use lights appropriately. Always drive so you can stop safely within the distance you can see to be clear.`
      },
      {
        heading: '13. Summary',
        body: `Safe driving on country roads requires:
• Constant observation and anticipation using LADA.
• Appropriate speed for visibility and conditions.
• Correct positioning to improve visibility and safety.
• Smooth steering and progressive braking.
• Patience and cooperation when meeting oncoming traffic.
• Awareness of animals, pedestrians, cyclists and farm vehicles.

Country roads demand skill, judgement and restraint. Driving safely here is an important part of becoming a confident, responsible driver and is commonly assessed during the DVSA practical test.`
      }
    ]
  },
  17: {
    title: 'Driving Conditions',
    sections: [
      {
        heading: '1. Driving Conditions – Overview',
        body: `Driving conditions can change quickly and significantly affect how safely a vehicle can be driven. Weather, light levels, road surface conditions and traffic levels all influence visibility, grip and stopping distances.

Safe drivers adjust their speed, positioning, observation and vehicle control to suit the conditions rather than relying on speed limits alone.`
      },
      {
        heading: '2. Why Driving Conditions Matter',
        body: `Poor or changing driving conditions can:
• Reduce visibility.
• Reduce tyre grip.
• Increase stopping distances.
• Increase driver workload and fatigue.

Adapting to conditions is a key part of safe, defensive driving and is commonly assessed during the DVSA practical driving test.`
      },
      {
        heading: '3. Wet Weather (Rain)',
        body: `Rain affects both grip and visibility.

Key risks
• Longer stopping distances.
• Reduced tyre grip (higher risk of skidding and aquaplaning).
• Spray from other vehicles reducing visibility.

Safe driving practices
• Reduce speed.
• Increase following distance.
• Use headlights when visibility is reduced.
• Avoid harsh braking and sudden steering.
• Take extra care on bends, roundabouts and painted road markings.`
      },
      {
        heading: '4. Fog',
        body: `Fog reduces visibility and makes it harder for other drivers to see you.

Key risks
• Very limited forward visibility.
• Difficulty judging speed and distance.
• Increased risk of rear-end collisions.

Safe driving practices
• Reduce speed significantly.
• Use dipped headlights.
• Use fog lights only when visibility is seriously reduced, and switch them off when conditions improve.
• Keep a larger following distance.
• Use road markings and reflectors as guidance.`
      },
      {
        heading: '5. Ice, Snow and Frost',
        body: `Cold conditions greatly reduce tyre grip.

Key risks
• Very long stopping distances.
• Loss of steering control.
• Slipping when braking or accelerating.

Safe driving practices
• Drive slowly and smoothly.
• Use gentle steering, braking and acceleration.
• Increase following distance significantly.
• Brake early and lightly.
• Avoid sudden manoeuvres.
• Be especially cautious on bridges, shaded areas and country roads.

If conditions are severe, consider whether the journey is necessary.`
      },
      {
        heading: '6. Strong Winds',
        body: `Strong winds can affect vehicle stability, especially on exposed roads and bridges.

Key risks
• Sudden gusts pushing the vehicle sideways.
• Increased danger when overtaking or being overtaken.
• Greater risk for high-sided vehicles.

Safe driving practices
• Reduce speed.
• Keep both hands on the steering wheel.
• Be prepared for sudden gusts.
• Take extra care when passing cyclists, motorcyclists and high-sided vehicles.`
      },
      {
        heading: '7. Bright Sun and Glare',
        body: `Bright sun, especially when low in the sky, can reduce visibility and temporarily blind drivers.

Key risks
• Reduced visibility of hazards, signs, signals and pedestrians.
• Difficulty judging distance.

Safe driving practices
• Reduce speed.
• Use sun visors or sunglasses.
• Increase following distance.
• Be ready for hazards hidden by glare.`
      },
      {
        heading: '8. Darkness and Night Driving',
        body: `Driving at night reduces visibility and can increase fatigue.

Key risks
• Reduced ability to judge speed and distance.
• Higher fatigue levels.
• Pedestrians, cyclists and animals are harder to see.

Safe driving practices
• Use headlights correctly and dip for oncoming traffic.
• Drive at a speed that allows you to stop within the distance lit by your headlights.
• Keep lights and windows clean.
• Stay alert for unlit or poorly lit road users.`
      },
      {
        heading: '9. Poor Road Surface Conditions',
        body: `Road surfaces can change due to weather, wear or contamination.

Common hazards
• Wet leaves.
• Mud or gravel.
• Standing water.
• Oil or diesel spills.
• Painted road markings becoming slippery when wet.

Safe driving practices
• Reduce speed.
• Brake earlier and more gently.
• Avoid sudden steering inputs.
• Increase observation and anticipation.`
      },
      {
        heading: '10. Heavy Traffic Conditions',
        body: `Traffic congestion changes how you plan and react.

Key risks
• Reduced space between vehicles.
• Stop-start driving.
• Increased impatience from road users.

Safe driving practices
• Maintain safe following distances.
• Anticipate traffic flow.
• Avoid harsh braking.
• Stay calm and patient.
• Use MSM regularly when speed or position changes.`
      },
      {
        heading: '11. Adjusting Your Driving Techniques',
        body: `In all driving conditions, you should adjust:
• Speed – to match visibility and grip.
• Following distance – increase when conditions worsen.
• Observation – look further ahead and wider.
• Control – brake, steer and accelerate smoothly.

Using LADA (Look, Assess, Decide, Act) helps you respond safely to changing conditions.`
      },
      {
        heading: '12. Summary',
        body: `Safe driving in different conditions requires:
• Understanding how conditions affect grip and visibility.
• Early adjustment of speed and following distance.
• Smooth, controlled steering, braking and acceleration.
• Effective observation and anticipation.
• Willingness to slow down or delay a journey when conditions are poor.

Driving conditions change, but safe drivers change their driving to match. Adapting effectively is essential for everyday safety and success in the DVSA practical driving test.`
      }
    ]
  },
  18: {
    title: 'Traffic Lights',
    sections: [
      {
        heading: '1. Traffic Lights – Overview',
        body: `Traffic lights control the flow of vehicles, cyclists and pedestrians at junctions, crossings and other busy areas. Correct use of traffic lights helps prevent collisions, reduce congestion and keep traffic moving safely.

Drivers must understand the meaning of each signal and how to approach, stop, move off and deal with traffic-light controlled junctions using safe observation and anticipation.`
      },
      {
        heading: '2. Purpose of Traffic Lights',
        body: `Traffic lights are used to:
• Control traffic flow at busy junctions.
• Reduce the risk of collisions.
• Manage pedestrian and cyclist crossings.
• Improve safety where roads intersect or merge.

Obeying traffic lights is a legal requirement and a key area assessed during the DVSA practical driving test.`
      },
      {
        heading: '3. The Standard Traffic Light Sequence',
        body: `Traffic lights follow a fixed sequence:

Red
• Stop behind the stop line.
• Do not proceed unless directed by a green filter arrow.

Red and Amber
• Get ready to move off.
• Do not move until the green light shows.

Green
• You may proceed if the way is clear.
• Give way to pedestrians still crossing and to traffic where required (for example, when turning right).

Amber
• Stop unless you are so close to the stop line that stopping suddenly would be unsafe.
• Do not accelerate to "beat" the red light.`
      },
      {
        heading: '4. Approaching Traffic Lights (Using MSM and MSPSL)',
        body: `Always plan your approach to traffic lights.

MSM – Mirror, Signal, Manoeuvre
• Check mirrors early.
• Signal if you are changing lanes or turning.

MSPSL – Mirror, Signal, Position, Speed, Look
• Position: Choose the correct lane in good time and follow lane arrows.
• Speed: Reduce speed early and smoothly.
• Look: Observe the traffic lights, road markings, pedestrians and other road users.

Avoid harsh braking and sudden lane changes. Good planning helps you stop or proceed smoothly and safely.`
      },
      {
        heading: '5. Stopping at Traffic Lights',
        body: `When stopping at traffic lights:
• Stop behind the stop line.
• Keep a safe distance from the vehicle in front.
• Apply the handbrake if stationary for a longer period.
• Select neutral when appropriate.

Remain alert while waiting, as traffic conditions and signals can change quickly.`
      },
      {
        heading: '6. Moving Off from Traffic Lights',
        body: `Before moving off when the light changes to green:
• Check mirrors.
• Look for pedestrians still crossing.
• Watch for cyclists filtering through traffic.
• Be aware of vehicles that may jump the red light.

Move off smoothly and confidently only when the way is clear.`
      },
      {
        heading: '7. Traffic Light Controlled Junctions',
        body: `At junctions controlled by traffic lights:
• Follow lane markings and directional arrows.
• Do not block the junction if traffic ahead has stopped.
• Be aware of vehicles turning across your path.
• Use LADA (Look, Assess, Decide, Act) to judge when it is safe to proceed.

Always ensure your exit is clear before entering the junction.`
      },
      {
        heading: '8. Filter Arrows',
        body: `Some traffic lights include green filter arrows.

Green Filter Arrow
• You may proceed in the direction of the arrow only.
• Other traffic must wait.

No Filter Arrow
• You may still turn when the main green light is on, but you must give way to oncoming traffic and pedestrians.

Filter arrows and lane arrows override normal priority rules. Always follow them carefully.`
      },
      {
        heading: '9. Pedestrian Crossings at Traffic Lights',
        body: `Pedestrian crossings controlled by traffic lights may include pelican, puffin and toucan crossings.

Driver responsibilities:
• Stop when the light is red.
• Allow pedestrians already on the crossing to finish crossing when the light changes.
• Watch for pedestrians who may start crossing late.

Never try to rush pedestrians. Be patient and prepared to wait.`
      },
      {
        heading: '10. Cyclists and Motorcyclists at Traffic Lights',
        body: `Be alert for:
• Cyclists filtering through traffic.
• Advanced Stop Lines (ASLs) and cycle boxes.
• Motorcyclists accelerating quickly when lights change.

Do not stop in cycle boxes unless unavoidable. Always check mirrors before moving off and watch for blind spots.`
      },
      {
        heading: '11. Box Junctions with Traffic Lights',
        body: `Yellow box junctions are often used alongside traffic lights.

Rules:
• Do not enter the box unless your exit is clear.
• You may enter to turn right if your exit is blocked by oncoming traffic or other right-turning traffic.
• Stopping in a box junction without a valid reason is an offence.

Plan ahead and anticipate traffic flow to avoid blocking the junction.`
      },
      {
        heading: '12. Traffic Lights Out of Order',
        body: `If traffic lights are not working:
• Treat the junction as an uncontrolled junction.
• Proceed with extreme caution.
• Use LADA to assess who is moving, who is waiting and where the safe gaps are.
• Follow any temporary signs, signals or police instructions.

Never assume others will give way. Move only when it is clearly safe.`
      },
      {
        heading: '13. Common Hazards at Traffic Lights',
        body: `Be prepared for:
• Vehicles jumping amber or red lights.
• Sudden braking by vehicles ahead.
• Pedestrians crossing late.
• Cyclists filtering into blind spots.
• Drivers changing lanes at the last moment.

Stay alert and do not assume others will always obey signals or lane markings.`
      },
      {
        heading: '14. Summary',
        body: `Safe use of traffic lights requires:
• Understanding the traffic light sequence.
• Correct use of MSM and MSPSL on approach.
• Smooth stopping and moving off.
• Awareness of pedestrians, cyclists and motorcyclists.
• Correct response to filter arrows and lane markings.
• Anticipation of hazards at controlled junctions.

Traffic lights help manage risk, but safe driving depends on your observation, planning and control. Correct behaviour at traffic lights is essential for everyday driving and success in the DVSA practical driving test.`
      }
    ]
  },
  19: {
    title: 'Manoeuvres',
    sections: [
      {
        heading: '1. Manoeuvres – Overview',
        body: `Manoeuvres are low-speed driving tasks that test your ability to control the vehicle accurately, observe effectively and make safe decisions in confined spaces. They require good planning, precise steering, smooth control and strong all-round observation.

Manoeuvres are assessed during the DVSA practical driving test and are also essential everyday driving skills for parking, turning and positioning the vehicle safely.`
      },
      {
        heading: '2. Key Principles of Manoeuvres',
        body: `All manoeuvres follow the same core principles:

• Observation – constant, effective all-round checks.
• Control – smooth use of steering, clutch, brake and accelerator (or brake control in automatic cars).
• Accuracy – correct positioning and alignment.
• Safety – stopping if anyone is at risk.

There is no time pressure. Examiners want to see safe, controlled and accurate driving, not speed.`
      },
      {
        heading: '3. Observation (360° Awareness)',
        body: `Before and during any manoeuvre you must maintain strong all-round observation:
• Check all mirrors.
• Check blind spots.
• Look over both shoulders where necessary.
• Continue checking throughout the manoeuvre.

If a pedestrian, cyclist or vehicle appears:
• Stop immediately.
• Reassess using LADA.
• Only continue when it is safe.

Inadequate observation is one of the most common reasons for test faults during manoeuvres.`
      },
      {
        heading: '4. Low-Speed Control',
        body: `Good low-speed control is essential for safe manoeuvres.

Key techniques:
• Keep speed at walking pace or slower.
• Use smooth clutch control (manual) or gentle brake control (automatic).
• Avoid harsh acceleration or sudden braking.
• Use slow, controlled steering.

If you lose control or your steering becomes messy, stop, re-check and correct safely.`
      },
      {
        heading: '5. The Main Manoeuvres',
        body: `During the DVSA practical driving test, you may be asked to complete one manoeuvre.

Common manoeuvres include:
• Parallel park.
• Bay parking (forward or reverse).
• Pulling up on the right and reversing.

The focus is always safety, control and effective observation.`
      },
      {
        heading: '6. Parallel Park',
        body: `Parallel parking tests your observation, steering accuracy, distance judgement and vehicle control.

Key points:
• Start alongside the parked vehicle.
• Reverse slowly and accurately into the space.
• Finish close to and parallel with the kerb.
• Avoid touching the kerb.
• Aim to complete within around two car lengths.

Keep checking all around throughout, and stop if anyone approaches.`
      },
      {
        heading: '7. Bay Parking (Forward and Reverse)',
        body: `Bay parking can be completed forwards or backwards.

7.1 Forward Bay Parking
• Observe carefully before turning in.
• Steer accurately.
• Finish centred in the bay.

7.2 Reverse Bay Parking
• Strong emphasis on observation.
• Often gives better control and an easier, safer exit.

Key points for both:
• Check mirrors and blind spots before moving.
• Keep speed very slow.
• Stay within the lines.
• Correct position safely if needed.`
      },
      {
        heading: '8. Pulling Up on the Right and Reversing',
        body: `This manoeuvre tests your ability to reverse in a straight line, control speed and steering, and maintain awareness of traffic.

Key points:
• Pull up safely on the right-hand side of the road.
• Check all around before reversing.
• Reverse slowly for about two car lengths.
• Keep reasonably close to the kerb.
• Stop if traffic approaches.
• Rejoin traffic safely when finished (use MSM).

Keep checking all around and be prepared to pause to let other road users pass.`
      },
      {
        heading: '9. Using MSM and LADA During Manoeuvres',
        body: `MSM – Mirror, Signal, Manoeuvre
• Mirror: Check surroundings before moving.
• Signal: Use a signal if it will help or inform others.
• Manoeuvre: Carry out the manoeuvre slowly and safely.

LADA – Look, Assess, Decide, Act
• Look: Check all directions.
• Assess: Identify who may be affected.
• Decide: Whether to continue or stop.
• Act: Move only when safe.

Using MSM and LADA together supports safe, calm decision-making.`
      },
      {
        heading: '10. Correcting Mistakes',
        body: `You are allowed to correct your position during a manoeuvre.

Key points:
• Stop first.
• Re-check all around.
• Correct slowly.
• Do not rush.

Examiners prefer a safe correction rather than continuing with poor control or poor positioning.`
      },
      {
        heading: '11. Common Faults During Manoeuvres',
        body: `Common mistakes include:
• Inadequate observation.
• Moving too fast.
• Poor steering control.
• Touching the kerb.
• Finishing too far from the kerb or outside bay lines.
• Failing to stop for pedestrians or vehicles.

Most faults can be avoided by slowing down, checking more often and being willing to stop and reassess.`
      },
      {
        heading: '12. Safety Over Perfection',
        body: `Manoeuvres do not need to be perfect.

Examiners are looking for:
• Safety.
• Control.
• Awareness.
• Calm decision-making.

Stopping, checking and correcting is always better than continuing unsafely.`
      },
      {
        heading: '13. Summary',
        body: `Successful manoeuvres require:
• Constant observation.
• Excellent low-speed control.
• Accurate steering.
• Safe use of MSM and LADA.
• Willingness to stop and reassess.

Manoeuvres demonstrate your ability to control the car precisely and safely. Mastering them builds confidence and is a key step toward passing the DVSA practical driving test and driving independently.`
      }
    ]
  },
  20: {
    title: 'Emergency Stop',
    sections: [
      {
        heading: '1. Emergency Stop – Overview',
        body: `The emergency stop tests your ability to react quickly, safely and under control when an unexpected hazard appears. It demonstrates how effectively you can stop the vehicle promptly while maintaining full control and awareness of what is happening around you.

During the DVSA practical driving test, the examiner may ask you to carry out an emergency stop to assess your reactions, braking technique and observation skills.`
      },
      {
        heading: '2. Purpose of the Emergency Stop',
        body: `The emergency stop is designed to:
• Test your reaction time.
• Assess your braking control.
• Check your ability to keep the vehicle under control.
• Ensure you can stop safely in a genuine emergency.

It represents sudden hazards such as:
• A child running into the road.
• A vehicle stopping suddenly.
• An object appearing unexpectedly in your path.`
      },
      {
        heading: '3. When You May Be Asked to Perform an Emergency Stop',
        body: `During the driving test:
• You will usually be told in advance that an emergency stop may be required.
• The examiner will check that it is safe before giving the signal.
• You must react only when the examiner gives the clear signal, usually a verbal command combined with a hand signal.

Do not anticipate or practise the stop unless instructed.`
      },
      {
        heading: '4. Emergency Stop Procedure',
        body: `4.1 React Immediately
• Brake firmly and progressively.
• Keep both hands on the steering wheel.
• Keep the vehicle travelling in a straight line.
• In a manual car, press the clutch down fully just before the vehicle stops.

Do not worry about stalling – stopping safely is the priority.

4.2 Bringing the Vehicle to a Stop
• Stop the vehicle as quickly as possible while remaining in full control.
• Avoid steering sharply or swerving.
• If your car has ABS, the brake pedal may vibrate – keep firm pressure applied.`
      },
      {
        heading: '5. After the Vehicle Has Stopped',
        body: `Once the vehicle has stopped:
• Apply the handbrake.
• Select neutral.
• Stay calm and assess the situation.

The examiner will then instruct you when to move off again.`
      },
      {
        heading: '6. Moving Off After an Emergency Stop',
        body: `Before moving off again:
• Check all around, including mirrors and blind spots.
• Look for pedestrians, cyclists or vehicles that may have stopped behind you.
• Signal if necessary.
• Rejoin traffic safely using MSM (Mirror, Signal, Manoeuvre).

Do not rush – treat this as a normal move-off situation.`
      },
      {
        heading: '7. Use of Observation',
        body: `Although the emergency stop focuses on reaction, observation remains important:
• Be aware of traffic behind before moving off again.
• Watch for pedestrians or cyclists near the vehicle.
• Check that the road is clear and safe before rejoining traffic.

Poor observation after stopping can result in driving faults.`
      },
      {
        heading: '8. Common Faults During an Emergency Stop',
        body: `Common mistakes include:
• Delayed reaction to the examiner's signal.
• Not braking firmly enough.
• Losing steering control.
• Forgetting to apply the handbrake after stopping.
• Failing to check properly before moving off again.

Focus on safety, control and awareness rather than speed alone.`
      },
      {
        heading: '9. Manual vs Automatic Vehicles',
        body: `Manual Vehicles
• Brake firmly.
• Press the clutch down fully just before stopping to prevent stalling.

Automatic Vehicles
• Brake firmly.
• No clutch control is required.

While the process is simpler in an automatic vehicle, control and observation are equally important.`
      },
      {
        heading: '10. Safety Over Smoothness',
        body: `An emergency stop is not intended to be smooth or comfortable – it is intended to be effective.

Examiners are looking for:
• A quick reaction.
• Firm, controlled braking.
• Stable steering.
• A safe, complete stop.
• Correct observation before moving off again.`
      },
      {
        heading: '11. Summary',
        body: `A safe emergency stop requires:
• Immediate reaction to the examiner's signal.
• Firm, progressive braking.
• Keeping the vehicle straight and under control.
• Correct use of the clutch in a manual vehicle.
• Applying the handbrake once stopped.
• Effective observation before moving off again.

The emergency stop shows your ability to react to danger and control the vehicle safely. Performing it confidently and correctly is an important part of becoming a responsible driver and succeeding in the DVSA practical driving test.`
      }
    ]
  },
  21: {
    title: 'Pedestrian Crossings',
    sections: [
      {
        heading: '1. Pedestrian Crossings – Overview',
        body: `Pedestrian crossings are designed to allow people to cross the road safely. As a driver, you must understand the different types of crossings, know when to stop, and recognise your legal responsibilities towards pedestrians and other vulnerable road users.

Pedestrian awareness and correct behaviour at crossings are closely assessed during the DVSA practical driving test.`
      },
      {
        heading: '2. Purpose of Pedestrian Crossings',
        body: `Pedestrian crossings are used to:
• Provide safe places for people to cross the road.
• Reduce collisions involving pedestrians.
• Manage traffic flow in busy areas.
• Protect vulnerable road users.

Drivers must always be prepared to slow down or stop near pedestrian crossings.`
      },
      {
        heading: '3. General Rules at Pedestrian Crossings',
        body: `At all pedestrian crossings:
• Approach with caution.
• Look well ahead for pedestrians waiting to cross.
• Be prepared to stop.
• Never overtake the vehicle nearest to the crossing.
• Do not block the crossing or zig-zag markings.

Always prioritise pedestrian safety.`
      },
      {
        heading: '4. Zebra Crossings',
        body: `Zebra crossings are identified by black and white stripes and flashing amber beacons.

Driver responsibilities:
• You must give way when a pedestrian is waiting to cross or has stepped onto the crossing.
• Slow down and be ready to stop.
• Stop before the crossing and allow pedestrians to cross fully.
• Remain stopped until the crossing is completely clear.

Do not wave pedestrians across or signal other drivers to proceed.`
      },
      {
        heading: '5. Pelican Crossings',
        body: `Pelican crossings are controlled by traffic lights.

When the light is red
• Stop behind the stop line.

Flashing amber
• You may proceed only if the crossing is clear of pedestrians.
• You must wait if pedestrians are still crossing.

Always check carefully before moving off.`
      },
      {
        heading: '6. Puffin Crossings',
        body: `Puffin crossings use sensors to detect pedestrians.

Key points:
• Pedestrians may still be crossing even if the signal changes.
• There is no flashing amber phase.

Driver responsibilities:
• Stop when the light is red.
• Check the crossing carefully before moving off.
• Be patient, especially with slower pedestrians.`
      },
      {
        heading: '7. Toucan Crossings',
        body: `Toucan crossings allow both pedestrians and cyclists to cross.

Key points:
• Treat them the same as puffin crossings.
• Watch for cyclists crossing at speed.
• Do not assume the crossing will clear quickly.

Always check carefully before moving off.`
      },
      {
        heading: '8. Pedestrian Crossings at Traffic Lights and Junctions',
        body: `Some pedestrian crossings form part of a traffic-light controlled junction.

Driver responsibilities:
• Obey traffic lights and filter arrows.
• Allow pedestrians to finish crossing even if the lights change.
• Do not block the crossing when waiting in traffic.

Always ensure the crossing is clear before moving off.`
      },
      {
        heading: '9. Pedestrians Near Side Roads and Junction Mouths',
        body: `Pedestrians may cross side roads and junction mouths even where there is no marked crossing.

Key points:
• When turning into or out of a side road, check for pedestrians crossing or waiting to cross.
• Give way where required and proceed only when safe.

Always check carefully before turning left or right.`
      },
      {
        heading: '10. Common Hazards at Pedestrian Crossings',
        body: `Be especially aware of:
• Children running onto crossings.
• Elderly or disabled pedestrians crossing slowly.
• Pedestrians stepping out from behind parked vehicles.
• Cyclists crossing at toucan crossings.
• Pedestrians starting to cross late.

Approach crossings at a speed that allows you to stop safely.`
      },
      {
        heading: '11. Pedestrian Crossings and the DVSA Test',
        body: `During the DVSA practical test, examiners expect you to:
• Anticipate pedestrian crossings early.
• Slow down and stop smoothly when required.
• Give pedestrians priority where required.
• Show patience, awareness and control.

Failing to give way to pedestrians when required is likely to be a serious fault.`
      },
      {
        heading: '12. Summary',
        body: `Safe use of pedestrian crossings requires:
• Early observation and anticipation.
• Understanding the different crossing types.
• Willingness to slow down or stop.
• Giving pedestrians priority where required.
• Patience and courtesy.

Pedestrian crossings exist to protect vulnerable road users. Treating them with respect and care is essential for safe driving and for passing the DVSA practical driving test.`
      }
    ]
  },
  22: {
    title: 'Making Progress',
    sections: [
      {
        heading: '1. Making Progress – Overview',
        body: `Making progress means driving at an appropriate speed for the road, traffic and conditions, without being hesitant or unnecessarily slow. It is about balancing safety and efficiency, ensuring you do not delay other road users while still maintaining full control of the vehicle.

The DVSA expects drivers to make safe, positive progress whenever conditions allow.`
      },
      {
        heading: '2. What Making Progress Means',
        body: `Making progress does not mean:
• Driving as fast as possible.
• Exceeding speed limits.
• Taking risks.

Making progress does mean:
• Driving close to the speed limit when safe and appropriate.
• Using opportunities to proceed when it is safe.
• Avoiding unnecessary hesitation.
• Keeping traffic flowing.

Safe progress shows confidence, awareness and good judgement.`
      },
      {
        heading: '3. Why Making Progress Is Important',
        body: `Poor progress can:
• Frustrate other road users.
• Increase the risk of unsafe overtaking by others.
• Cause unnecessary congestion.
• Lead to faults on the driving test.

Driving too slowly or hesitating without reason can be marked as a driving fault or, in some situations, a serious fault.`
      },
      {
        heading: '4. Speed and Progress',
        body: `4.1 Appropriate Speed
• Drive at a speed suitable for the road, traffic, weather and visibility.
• Use speed limits as a guide, not a target.
• Increase speed smoothly when conditions improve.

4.2 Avoiding Excessive Caution
Being overly cautious can be unsafe. Examples include:
• Stopping unnecessarily at clear junctions.
• Hesitating too long at roundabouts.
• Driving well below the speed limit with no clear reason.

Confidence comes from good observation and decision-making.`
      },
      {
        heading: '5. Observation and Planning',
        body: `Good progress depends on looking ahead and planning early.

Key points:
• Scan well ahead for hazards.
• Anticipate traffic flow.
• Identify safe gaps early.
• Decide in advance whether you can proceed.

Using LADA (Look, Assess, Decide, Act) helps you act positively without rushing.`
      },
      {
        heading: '6. Making Progress at Junctions',
        body: `At junctions:
• Use MSM and MSPSL.
• Look early for safe gaps.
• Commit confidently when it is safe.
• Avoid stopping if the junction is clearly open.

Hesitating after a safe gap appears can cause faults and confuse other drivers.`
      },
      {
        heading: '7. Making Progress on Open Roads',
        body: `On clear, open roads:
• Build speed smoothly up to an appropriate limit.
• Use higher gears when suitable.
• Maintain a steady speed.
• Avoid unnecessary braking.

Driving confidently on open roads demonstrates good vehicle control and awareness.`
      },
      {
        heading: '8. Making Progress in Traffic',
        body: `In heavier traffic:
• Keep up with the flow where safe.
• Avoid leaving large unnecessary gaps.
• Move off promptly when traffic moves.
• Maintain safe following distances.

Progress should never compromise safety.`
      },
      {
        heading: '9. Making Progress at Roundabouts',
        body: `At roundabouts:
• Look early for gaps.
• Match your speed to circulating traffic where safe.
• Enter when safe without hesitation.
• Avoid stopping unnecessarily when the way is clear.

Well-timed entry improves traffic flow and safety.`
      },
      {
        heading: '10. When NOT to Prioritise Progress',
        body: `Do not prioritise progress when:
• Visibility is poor.
• Road conditions are dangerous.
• Pedestrians, cyclists or vulnerable road users are present.
• You are unsure or visibility is restricted.

Safety always comes before progress.`
      },
      {
        heading: '11. Making Progress and the DVSA Test',
        body: `Examiners expect you to:
• Drive at an appropriate speed.
• Avoid unnecessary hesitation.
• Take safe opportunities.
• Keep traffic flowing where possible.

Failing to make progress is a common test fault, but rushing or taking risks is worse.`
      },
      {
        heading: '12. Common Faults Related to Progress',
        body: `Common issues include:
• Driving too slowly for no clear reason.
• Hesitating at clear junctions.
• Over-braking on open roads.
• Not moving off promptly.
• Missing safe gaps.

These faults often come from poor observation or lack of confidence.`
      },
      {
        heading: '13. Summary',
        body: `Safe making progress requires:
• Good observation and planning.
• Appropriate speed for conditions.
• Confident, timely decision-making.
• Effective use of MSM, MSPSL and LADA.
• Balancing safety with efficiency.

Making progress shows that you can drive safely, confidently and cooperatively with other road users. It is a key skill for everyday driving and an important assessment area in the DVSA practical driving test.`
      }
    ]
  },
  23: {
    title: 'Planning Skills',
    sections: [
      {
        heading: '1. Planning Skills – Overview',
        body: `Planning skills involve looking ahead, anticipating hazards and preparing early so you can drive smoothly, safely and confidently. Good planning reduces sudden braking, harsh steering and hesitation, and allows you to make timely, safe decisions.

Effective planning is a core skill expected by the DVSA and underpins almost every aspect of safe driving.`
      },
      {
        heading: '2. What Planning Skills Mean',
        body: `Planning skills are about:
• Thinking ahead, not just reacting.
• Anticipating what might happen next.
• Preparing the vehicle and your actions early.
• Making smooth, well-timed decisions.

Good planning helps you stay in control and avoid last-minute actions.`
      },
      {
        heading: '3. Why Planning Skills Are Important',
        body: `Poor planning can lead to:
• Sudden braking or steering.
• Missed hazards.
• Hesitation or rushed decisions.
• Increased stress and reduced safety.
• Driving faults during the test.

Good planning improves:
• Safety.
• Comfort.
• Traffic flow.
• Confidence.`
      },
      {
        heading: '4. Looking Ahead and Scanning',
        body: `Planning starts with effective observation.

Key points:
• Look well ahead, not just at the vehicle in front.
• Scan the road environment, not one single point.
• Check mirrors regularly.
• Look for signs, markings and changes in road layout.

The further you look ahead, the more time you have to plan.`
      },
      {
        heading: '5. Anticipation of Hazards',
        body: `Planning means anticipating potential hazards before they develop.

Examples include:
• Junctions ahead.
• Pedestrian crossings.
• Parked vehicles.
• Cyclists and motorcyclists.
• Changes in speed limits.
• Traffic lights or roundabouts.
• Bends, crests and narrow roads.

A helpful habit is asking yourself: "What might happen next?"`
      },
      {
        heading: '6. Using LADA for Planning',
        body: `Planning works best when using LADA (Look, Assess, Decide, Act):

• Look: Observe the road ahead and around you.
• Assess: Identify possible hazards and how they may affect you.
• Decide: Decide early whether to slow, change position, stop or proceed.
• Act: Act smoothly and in good time.

LADA supports calm, confident decisions instead of rushed reactions.`
      },
      {
        heading: '7. Planning Speed and Position',
        body: `Good planning allows you to:
• Adjust speed early.
• Select the correct lane in advance.
• Choose safe road positions.
• Avoid harsh braking.

Examples:
• Slowing before a bend, not during it.
• Selecting the correct lane well before a junction.
• Reducing speed early near pedestrian crossings.`
      },
      {
        heading: '8. Planning at Junctions and Roundabouts',
        body: `At junctions and roundabouts:
• Look early for signs and lane markings.
• Decide lane choice in advance.
• Identify safe gaps early.
• Be ready to move smoothly when safe.

Late decisions often cause hesitation, missed opportunities or unsafe manoeuvres.`
      },
      {
        heading: '9. Planning in Traffic',
        body: `In traffic:
• Anticipate braking by vehicles ahead.
• Watch brake lights further ahead, not just the car directly in front.
• Maintain a steady speed where possible.
• Avoid unnecessary stop-start driving.

Good planning reduces stress and improves passenger comfort.`
      },
      {
        heading: '10. Planning for Vulnerable Road Users',
        body: `Always plan with vulnerable road users in mind:
• Pedestrians.
• Cyclists.
• Motorcyclists.
• Horse riders.

Expect unpredictable behaviour and allow extra space and time. Early planning helps you respond safely without sudden actions.`
      },
      {
        heading: '11. Planning Skills and the DVSA Test',
        body: `Examiners look for evidence that you:
• Anticipate hazards early.
• Choose correct lanes in good time.
• Adjust speed smoothly.
• Avoid last-minute actions.
• Drive calmly and confidently.

Poor planning often results in faults such as:
• Late lane changes.
• Harsh braking.
• Hesitation.
• Missed hazards.`
      },
      {
        heading: '12. Common Planning Errors',
        body: `Common mistakes include:
• Looking too close to the vehicle ahead.
• Reacting late to hazards.
• Leaving lane changes too late.
• Braking harshly instead of early.
• Failing to anticipate pedestrian or cyclist movements.

These errors usually come from lack of forward planning and limited scanning.`
      },
      {
        heading: '13. Summary',
        body: `Good planning skills require:
• Looking well ahead.
• Anticipating hazards early.
• Using LADA effectively.
• Adjusting speed and position in good time.
• Making smooth, timely decisions.

Planning skills turn driving from a reactive task into a controlled, confident process. Mastering them is essential for safe everyday driving and for success in the DVSA practical driving test.`
      }
    ]
  },
  24: {
    title: 'Independent Driving',
    sections: [
      {
        heading: '1. Independent Driving – Overview',
        body: `Independent driving tests your ability to drive safely and confidently without step-by-step guidance. It shows that you can make your own decisions, follow directions and deal with real-world driving situations while maintaining good control, observation and planning.

Independent driving is a key part of the DVSA practical driving test and reflects everyday driving after you pass.`
      },
      {
        heading: '2. What Independent Driving Means',
        body: `Independent driving does not mean:
• Driving without rules.
• Driving without observation.
• Driving quickly or taking risks.

Independent driving does mean:
• Following directions independently.
• Making your own safe decisions.
• Staying calm if you make a mistake.
• Driving safely without constant instruction.

You are assessed on driving ability, not navigation skills.`
      },
      {
        heading: '3. How Independent Driving Is Assessed',
        body: `During the DVSA practical test:
• Independent driving lasts for about 20 minutes.
• You will be asked to follow either:
  - A sat-nav, or
  - Traffic signs, or
  - Verbal directions.

The examiner will not give detailed driving instructions unless safety requires it.`
      },
      {
        heading: '4. Following a Sat-Nav',
        body: `When using a sat-nav:
• Follow directions calmly and safely.
• Keep looking at the road, not the screen.
• Listen carefully to spoken instructions.
• Position yourself early where possible.

If directions are unclear:
• Prioritise safety.
• Continue safely until the next opportunity.

You are not penalised for missing a turn if you drive safely.`
      },
      {
        heading: '5. Following Road Signs',
        body: `When following signs:
• Read signs early.
• Identify the correct lane in good time.
• Follow route numbers and place names.
• Stay calm in busy areas.

Signs may change quickly, so forward planning and early lane selection are essential.`
      },
      {
        heading: '6. Planning and Observation During Independent Driving',
        body: `Good independent driving relies on:
• Looking well ahead.
• Anticipating hazards.
• Planning speed and position early.
• Using mirrors regularly.

Use LADA (Look, Assess, Decide, Act) to support safe decision-making, especially when traffic conditions change.`
      },
      {
        heading: '7. Lane Discipline and Positioning',
        body: `During independent driving:
• Choose the correct lane early.
• Follow road markings and lane arrows.
• Avoid late or unsafe lane changes.
• If unsure, stay in a safe lane and continue.

Taking a safe route is always better than making a risky move to follow directions.`
      },
      {
        heading: '8. What If You Make a Mistake?',
        body: `Making a mistake does not automatically mean failing the test.

If you:
• Miss a turn.
• Choose the wrong lane.
• Take the wrong exit.

You should:
• Stay calm.
• Continue safely.
• Follow the road ahead.
• Avoid stopping suddenly or turning dangerously.

The examiner will adjust the route if needed.`
      },
      {
        heading: '9. Common Faults During Independent Driving',
        body: `Common faults include:
• Poor lane discipline.
• Late decisions.
• Hesitation at junctions.
• Poor observation.
• Focusing too much on directions and missing hazards.

Remember: driving safely is more important than following directions perfectly.`
      },
      {
        heading: '10. Independent Driving and Safety',
        body: `Safety is always the priority:
• Obey traffic signs and road markings.
• Follow speed limits.
• Give way when required.
• Watch for pedestrians, cyclists and motorcyclists.

If directions conflict with road signs, road markings or safety, always follow the rules of the road.`
      },
      {
        heading: '11. Independent Driving and Confidence',
        body: `Independent driving tests your confidence as well as skill.

Confidence comes from:
• Good preparation.
• Strong planning skills.
• Effective observation.
• Calm decision-making.

Driving independently shows you are ready to drive without instructor support.`
      },
      {
        heading: '12. Independent Driving in Everyday Life',
        body: `After passing your test, independent driving is how you will drive every day:
• Following sat-navs.
• Navigating new routes.
• Dealing with unexpected changes.
• Making safe decisions alone.

This part of the test prepares you for real-world driving.`
      },
      {
        heading: '13. Summary',
        body: `Successful independent driving requires:
• Calm, confident decision-making.
• Good observation and planning.
• Safe lane choice and positioning.
• Willingness to continue safely if you make a mistake.
• Prioritising safety over directions.

Independent driving shows the examiner that you can drive safely on your own. Staying calm, planning ahead and focusing on safety are the keys to success in this part of the DVSA practical driving test.`
      }
    ]
  },
  25: {
    title: 'Show Me, Tell Me Questions',
    sections: [
      {
        heading: '1. Show Me, Tell Me – Overview',
        body: `The Show Me, Tell Me questions form part of the DVSA practical driving test. They assess your basic vehicle safety knowledge and your ability to operate essential vehicle controls safely.

You will be asked:
• One "Tell Me" question before driving.
• One "Show Me" question while driving.

If you answer a question incorrectly, this results in one driving fault, not an automatic fail.`
      },
      {
        heading: '2. Purpose of Show Me, Tell Me Questions',
        body: `These questions are designed to:
• Check your understanding of basic vehicle safety.
• Ensure you can recognise common vehicle safety checks.
• Confirm you can safely operate controls while driving.

You are not expected to be a mechanic—only to demonstrate basic safety awareness.`
      },
      {
        heading: '3. "Tell Me" Questions (Asked Before Driving)',
        body: `Tell Me questions require you to explain how you would carry out a safety check. You do not need to physically demonstrate the check unless asked to open the bonnet.`
      },
      {
        heading: '4. Tell Me Questions and Answers',
        body: `4.1 Tell me how you would check that the brakes are working before starting a journey.
Answer:
• As you move off, apply the brakes. They should not feel spongy and the car should not pull to one side.

4.2 Tell me where you'd find the information for the recommended tyre pressures for this car and how tyre pressures should be checked.
Answer:
• The information can be found in the car manufacturer's handbook or guide.
• Tyre pressures should be checked when the tyres are cold using a reliable pressure gauge.
• Remember to check the spare tyre and refit valve caps.

4.3 Tell me how you would make sure your head restraint is correctly adjusted to provide the best protection.
Answer:
• Adjust the head restraint so the centre is at least as high as the eyes or top of the ears and as close to the back of the head as is comfortable.
• Some head restraints may not be adjustable.

4.4 Tell me how you'd check the tyres to ensure they have sufficient tread depth and are safe to use.
Answer:
• Tyres should have no cuts or bulges.
• The legal tread depth must be at least 1.6mm across the central three-quarters of the tyre and around the entire circumference.
• This can be checked using a tread depth gauge.

4.5 Tell me how you'd check that the headlights and tail lights are working.
Answer:
• Turn on the light switch (and ignition if required) and visually check the lights by walking around the vehicle.

4.6 Tell me how you'd know if there was a problem with the anti-lock braking system (ABS).
Answer:
• A warning light would illuminate on the dashboard if there is a fault with the ABS.

4.7 Tell me how you'd check the direction indicators are working.
Answer:
• Operate the hazard warning lights and walk around the vehicle to check that all indicators are working correctly.
• This is the preferred method as the ignition does not need to be switched on.

4.8 Tell me how you'd check the brake lights are working.
Answer:
• Press the brake pedal and use reflections in windows or doors, or ask someone to help check the brake lights.

4.9 Tell me how you'd check the power-assisted steering is working before starting a journey.
Answer:
• Apply gentle pressure to the steering wheel while starting the engine. The steering should move slightly as the system begins to operate.
• Steering should feel light as the vehicle starts to move.

4.10 Tell me how you'd switch on the rear fog light(s) and explain when you'd use them.
Answer:
• Operate the rear fog light switch (with dipped headlights on if required) and check the warning light.
• Fog lights must only be used in poor visibility and turned off when conditions improve.

4.11 Tell me how you'd switch your headlights from dipped to main beam and how you'd know main beam is on.
Answer:
• Operate the main beam control and check for the blue warning light on the dashboard.

4.12 Open the bonnet and tell me how you'd check the engine oil level.
Answer:
• Identify the dipstick, remove it and wipe it clean.
• Reinsert fully, remove again and check the oil level is between the minimum and maximum markings.
• Top up if needed without overfilling.

4.13 Open the bonnet and tell me how you'd check the engine coolant level.
Answer:
• Identify the coolant expansion tank and check the level is between the minimum and maximum markings.
• Only remove the cap and add coolant when the engine is cold.

4.14 Open the bonnet and tell me how you'd check the hydraulic brake fluid level.
Answer:
• Identify the brake fluid reservoir and check that the level is between the minimum and maximum markings.`
      },
      {
        heading: '5. "Show Me" Questions (Asked While Driving)',
        body: `Show Me questions require you to demonstrate a control when it is safe to do so.

Always prioritise control and observation. Only carry out the action when it is safe and without losing control of the vehicle.`
      },
      {
        heading: '6. Show Me Questions',
        body: `When it's safe to do so, show me how you would:

6.1 Wash and clean the rear windscreen.
6.2 Wash and clean the front windscreen.
6.3 Switch on your dipped headlights.
6.4 Set the rear demister.
6.5 Operate the horn.
6.6 Demist the front windscreen.
6.7 Open and close the side window.`
      },
      {
        heading: '7. Safety During "Show Me" Questions',
        body: `While answering Show Me questions:
• Keep full control of the vehicle.
• Check mirrors if needed.
• Do not rush.
• You may wait until it is safe to respond.

Safety always comes before demonstrating a control.`
      },
      {
        heading: '8. Key Test Reminder',
        body: `Remember:
• One incorrect answer = one driving fault.
• Knowledge is more important than perfect wording.
• Stay calm and confident.`
      },
      {
        heading: '9. Summary',
        body: `Show Me, Tell Me questions assess:
• Basic vehicle safety knowledge.
• Awareness of essential controls.
• Ability to operate controls safely.

Learning these questions builds confidence, improves safety awareness and helps you approach the DVSA driving test calmly and prepared.`
      }
    ]
  }
};

export default function CourseWorkDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = parseInt(urlParams.get('id'));
  const content = courseWorkContent[itemId];
  const [showAudioHint, setShowAudioHint] = useState(() => {
    const hasSeenHint = localStorage.getItem('audio_hint_seen');
    return !hasSeenHint && localStorage.getItem('enable_audio_reading') !== 'false';
  });

  const dismissAudioHint = () => {
    setShowAudioHint(false);
    localStorage.setItem('audio_hint_seen', 'true');
  };

  // Combine all section content into one text for audio
  const fullContentText = content?.sections?.map(section => 
    `${section.heading}. ${section.body}`
  ).join('. ') || '';

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('CourseWork')}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Course Work
            </Button>
          </Link>
          <p className="text-slate-500 text-center">Content not available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('CourseWork')}>
          <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Course Work
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">{content.title}</h1>
          </div>
          <p className="text-slate-500 text-sm">Last updated: December 2025</p>
        </div>

        {showAudioHint && (
          <Card className="border-[#F7B602] bg-amber-50 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-[#071739] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  You can use the audio player below to listen to this content being read aloud.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissAudioHint}
                className="h-6 w-6 p-0 flex-shrink-0"
                aria-label="Dismiss hint"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <SectionAudioPlayer 
          text={fullContentText} 
          sectionId="full-content"
        />

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-8 space-y-8">
            {content.sections.map((section, index) => (
              <div key={index} id={`section-${index}`}>
                <h2 className="text-xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {section.body}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Mobrage Driving Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}