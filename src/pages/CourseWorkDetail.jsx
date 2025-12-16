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

Safe use of junctions relies on the MSPSL routine (Mirror, Signal, Position, Speed, Look) together with the LADA routine (Look, Assess, Decide, Act) when observing.`
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
  const [currentPlayingSection, setCurrentPlayingSection] = useState(null);

  const handleSectionPlay = (sectionId) => {
    // Pause any other playing audio
    if (currentPlayingSection && currentPlayingSection !== sectionId) {
      window.speechSynthesis.cancel();
    }
    setCurrentPlayingSection(sectionId);
  };

  const dismissAudioHint = () => {
    setShowAudioHint(false);
    localStorage.setItem('audio_hint_seen', 'true');
  };

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
                  You can tap the audio icon under each heading to listen to this content being read aloud.
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

        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-8 space-y-8">
            {content.sections.map((section, index) => (
              <div key={index} id={`section-${index}`}>
                <h2 className="text-xl font-bold text-[#071739] mb-4">{section.heading}</h2>
                <SectionAudioPlayer 
                  text={section.body} 
                  sectionId={`section-${index}`}
                  onPlay={handleSectionPlay}
                />
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