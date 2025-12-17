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
        body: `A dual carriageway is a road where traffic travelling in opposite directions is separated by a central reservation, such as a barrier, grass verge, or crash barrier. Each direction usually has two or more lanes. A dual carriageway is defined by the presence of a central reservation, not by the number of lanes.`
      },
      {
        heading: '2. Speed Limits',
        body: `Cars and motorcycles: 70 mph unless signs indicate otherwise
Cars towing trailers and vans over 7.5 tonnes: 60 mph
Built-up areas: 30 mph unless a different speed limit is signed

Always check road signs, especially when entering towns, roadworks, or temporary speed restriction zones.`
      },
      {
        heading: '3. Lane Discipline',
        body: `Keep to the left-hand lane unless overtaking
Use right-hand lanes only for overtaking
Return to the left lane once overtaking is complete and safe
Avoid unnecessary use of the right-hand lane, also known as lane hogging

Some dual carriageways have three or more lanes. Unless signs state otherwise, apply motorway-style lane discipline.`
      },
      {
        heading: '4. Emerging into a Side Road (Turning Left and Right)',
        body: `When emerging from a side road onto a dual carriageway, careful observation and accurate judgement are essential due to higher traffic speeds.

Use the MSM / PSL routine before moving off
Assess the speed and distance of approaching traffic carefully
Turning left: join the left-hand carriageway only when there is a safe gap
Turning right: cross the near carriageway only when safe and, if provided, wait safely in the central reservation before joining the opposite carriageway
Never assume approaching vehicles are travelling at the speed limit

Do not rush your decision. If the gap is not sufficient, wait until it is safe to proceed.`
      },
      {
        heading: '5. After Joining the Carriageway',
        body: `Build up speed progressively to match the flow of traffic
Remain in the left-hand lane unless overtaking
Check mirrors regularly to maintain awareness of surrounding traffic
Maintain a safe following distance from the vehicle ahead
Be prepared for faster-moving vehicles approaching from behind

Smooth acceleration and good mirror use help you integrate safely with traffic already travelling on the dual carriageway.`
      },
      {
        heading: '6. Leaving the Dual Carriageway (Turning Left with No Slip Road)',
        body: `Some dual carriageways require drivers to turn left directly into a side road without the use of a slip road.

Check mirrors early and signal left in good time
Position correctly in the left-hand lane
Reduce speed smoothly while remaining aware of traffic behind
Avoid sudden braking on the main carriageway
Watch for pedestrians, cyclists, or vehicles waiting to emerge

Early signalling and controlled speed reduction allow other road users to anticipate your actions.`
      },
      {
        heading: '7. Leaving the Dual Carriageway (Turning Right)',
        body: `Turning right off a dual carriageway is a higher-risk manoeuvre and must only be carried out where signs and road markings permit.

Check mirrors early and signal right clearly
Move into the right-hand lane or designated turning lane where provided
Position safely at the turning point and wait for a suitable gap in oncoming traffic
Use the central reservation as a safe waiting area where permitted
Complete the turn smoothly without causing other traffic to brake or swerve

Never attempt a right turn across a dual carriageway unless it is clearly allowed and can be completed safely.`
      },
      {
        heading: '8. Hazards to Watch For',
        body: `High approach speeds from other vehicles
Vehicles joining or leaving unexpectedly
Sudden congestion or roadworks
Strong crosswinds on exposed sections
Changing or variable speed limits`
      },
      {
        heading: '9. Common Learner Mistakes',
        body: `Misjudging the speed of approaching traffic
Hesitating for too long or moving off too quickly
Poor lane positioning after joining
Late or unclear signalling when leaving
Attempting unsafe right turns`
      },
      {
        heading: '10. Summary',
        body: `Driving on dual carriageways requires strong observation, accurate judgement, and good lane discipline. By planning ahead, using correct positioning, and following the MSM / PSL routine, drivers can join, travel on, and leave dual carriageways safely and confidently.`
      }
    ]
  },
  16: {
    title: 'Country Roads',
    sections: [
      {
        heading: '1. Country Roads – Overview',
        body: `Country roads are often narrow, winding roads found in rural areas. They may have high speed limits, limited visibility, and fewer road markings, which means drivers must rely heavily on observation, anticipation, and positioning. Although they can appear quiet, country roads can be unpredictable and hazardous.`
      },
      {
        heading: '2. Speed Limits on Country Roads',
        body: `Single carriageway country roads: 60 mph unless signs indicate otherwise
Dual carriageway country roads: 70 mph unless signs indicate otherwise

The speed limit is a maximum, not a target. You must always drive at a speed suitable for the road, weather, traffic, and visibility.`
      },
      {
        heading: '3. Key Characteristics of Country Roads',
        body: `Narrow lanes, sometimes only wide enough for one vehicle
Sharp bends and blind corners
Limited or no street lighting
Uneven road surfaces, potholes, or mud
Hedges, trees, and walls close to the carriageway
Few road signs or road markings`
      },
      {
        heading: '4. Meeting Oncoming Traffic',
        body: `Slow down early when you see oncoming vehicles
Use passing places where provided
Give way courteously when it is safe to do so
Be prepared to stop if necessary
Do not assume the other driver will give way

Patience and cooperation are essential on narrow country roads.`
      },
      {
        heading: '5. Bends and Corners',
        body: `Many country road incidents happen on bends due to limited visibility and incorrect speed.

Reduce speed before entering the bend
Position slightly to the left to improve your view ahead
Keep well within your lane and do not cut corners
Be prepared for oncoming vehicles, cyclists, animals, mud, or debris

Never cross the centre line or assume the road ahead is clear.`
      },
      {
        heading: '6. Overtaking on Country Roads',
        body: `Overtaking should be rare on country roads and must only be attempted when it is clearly safe and legal.

Only overtake when you can clearly see the road ahead is clear
Never overtake near bends, junctions, hills, dips, or where visibility is restricted
Watch for slow-moving vehicles such as tractors and farm machinery
Be aware of hidden junctions, field entrances, and driveways

If in doubt, do not overtake.`
      },
      {
        heading: '7. Junctions on Country Roads',
        body: `Some junctions are poorly marked, hidden, or have limited visibility
Reduce speed early and look well ahead
Expect vehicles to appear suddenly from side roads and entrances
Take extra care when turning right or emerging onto a faster road`
      },
      {
        heading: '8. Vulnerable Road Users',
        body: `Cyclists
Horse riders
Pedestrians
Farm vehicles
Animals, including livestock and wildlife

Slow down early, give plenty of space, and be prepared to stop.`
      },
      {
        heading: '9. Weather and Road Conditions',
        body: `Rain can cause mud, flooding, and reduced grip
Ice and frost are common in shaded areas
Fallen leaves can make the road surface slippery
Fog can significantly reduce visibility

Increase your following distance and adjust your speed to match conditions.`
      },
      {
        heading: '10. Use of Headlights and Horn',
        body: `Use dipped headlights in poor visibility
At night, dip headlights early on bends to avoid dazzling others
Use the horn briefly on narrow bends if visibility is very limited where appropriate`
      },
      {
        heading: '11. Common Learner Mistakes',
        body: `Driving too fast for the road and conditions
Poor positioning on bends
Late braking and harsh braking
Assuming the road is clear because it looks quiet
Failing to anticipate hidden hazards`
      },
      {
        heading: '12. Key Safety Tips',
        body: `Plan well ahead and read the road early
Drive at a speed that allows you to stop safely within the distance you can see
Stay alert and expect the unexpected
Keep a safe following distance
Be patient and courteous with other road users`
      },
      {
        heading: '13. Summary',
        body: `Country roads require calm, controlled, and observant driving. By reducing speed, improving anticipation, and respecting the unpredictable nature of rural roads, drivers can travel safely and confidently.`
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