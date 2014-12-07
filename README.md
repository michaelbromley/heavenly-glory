# Heavenly Glory

Ever wondered what it would be like to be Bruce Lee? Ever wished your [every slightest limb movement](http://youtu.be/k0HMz4EjWxs?t=45s) would be accompanied by
a cool swooshing air sound? Ever wanted your punches and kicks to make amazing [wood-block-snapping noises](http://youtu.be/usdcpWXPaDY?t=40s)?

Yes, yes and yes?

Martial arts experts train for years - often decades - to master the skills needed to create these amazing sound effects.
Thanks to the power of the modern web platform, *you* can now experience what it feels like to possess such skills.

## [Try The Demo](http://www.michaelbromley.co.uk/experiments/heavenly-glory)

## What is it?

This is an experiment in using the (getUserMedia)[https://developer.mozilla.org/en-US/docs/NavigatorUserMedia.getUserMedia]
 and [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) APIs to implement simple motion detection which triggers
 audio playback.

 The motions detection is based on a method outlined in (this article by Soundstep)[http://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html]
 and borrows from an implementation at (ReallyGood/js-motion-detection)[https://github.com/ReallyGood/js-motion-detection].

## Features

- Variable sensitivity to motion
- View the motion detection canvas to see what it sees
- Customize the movie title and star name, which is encoded in the URL hash for sharing
- Real kung fu sounds
- Feel powerful and cool
- Also works great with kids/babies and animals

## Browser Support

Currently the browsers that support both getUserMedia and Web Audio are Chrome, Firefox and Opera.

### Attribution

The following images were used in the poster and require attribution:

- https://www.flickr.com/photos/kurt-b/9453209945

## License

MIT