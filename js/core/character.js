/**
 * Character Rendering Library (CharLib)
 * A scalable, completely code-generated rendering engine for arcade characters.
 * Draws characters around a center origin (0,0) for easy physics integration.
 */

const CharLib = {
    // --- FACES ---
    faces: {
        classic: (p, variant, emotion, isBlink) => {
            const isGirl = variant === 'girl';
            p.fill(0); p.noStroke();

            if (isGirl) {
                p.fill(0, 50, 100, 0.4); 
                p.ellipse(-22, 5, 12, 8);
                p.ellipse(22, 5, 12, 8);
                p.fill(0);
            }

            if (isBlink) {
                p.stroke(0); p.strokeWeight(3);
                p.line(-20, -5, -10, -5);
                p.line(10, -5, 20, -5);
                if (isGirl) { p.line(-20, -5, -25, -10); p.line(20, -5, 25, -10); }
            } else {
                if (emotion === 'happy') {
                    p.stroke(0); p.strokeWeight(3); p.noFill();
                    p.arc(-15, -2, 10, 10, p.PI, p.TWO_PI);
                    p.arc(15, -2, 10, 10, p.PI, p.TWO_PI);
                    if (isGirl) { p.line(-20, -2, -25, -7); p.line(20, -2, 25, -7); }
                } else if (emotion === 'confused') {
                    p.fill(0); p.noStroke();
                    p.circle(-15, -5, 14);
                    p.circle(15, -5, 6);
                    if (isGirl) { p.stroke(0); p.strokeWeight(2); p.line(-22, -5, -28, -10); p.line(18, -5, 24, -8); }
                } else {
                    p.fill(0); p.noStroke();
                    p.circle(-15, -5, 10);
                    p.circle(15, -5, 10);
                    if (isGirl) { p.stroke(0); p.strokeWeight(2); p.line(-20, -5, -25, -10); p.line(20, -5, 25, -10); }
                }
            }

            p.stroke(0); p.strokeWeight(3);
            if (emotion === 'angry') {
                p.line(-22, -15, -10, -10);
                p.line(22, -15, 10, -10);
            } else if (emotion === 'sad') {
                p.line(-22, -10, -10, -15);
                p.line(22, -10, 10, -15);
            }

            p.stroke(0); p.strokeWeight(3);
            if (emotion === 'normal') {
                p.noFill(); p.arc(0, 10, 20, 15, 0, p.PI);
            } else if (emotion === 'happy') {
                p.fill(0); p.arc(0, 10, 24, 24, 0, p.PI);
            } else if (emotion === 'angry') {
                p.noFill(); p.arc(0, 15, 15, 10, p.PI, p.TWO_PI);
            } else if (emotion === 'sad') {
                p.noFill(); p.arc(0, 15, 20, 15, p.PI, p.TWO_PI);
            } else if (emotion === 'confused') {
                p.noFill(); p.strokeWeight(2);
                p.beginShape();
                p.vertex(-10, 12); p.vertex(-5, 15); p.vertex(0, 10); p.vertex(5, 15); p.vertex(10, 12);
                p.endShape();
            }
        },

        derpy: (p, variant, emotion, isBlink) => {
            const isGirl = variant === 'girl';
            
            if (isGirl) {
                p.noStroke(); p.fill(0, 50, 100, 0.4); 
                p.ellipse(-24, 8, 14, 10); p.ellipse(24, 8, 14, 10);
            }

            if (!isBlink) {
                p.fill(255); p.stroke(0); p.strokeWeight(2);
                if (emotion === 'sad') {
                    p.arc(-12, -8, 24, 24, 0, p.PI);
                    p.arc(16, -5, 20, 20, 0, p.PI);
                } else {
                    p.circle(-12, -10, 24);
                    p.circle(16, -5, 20);
                }
                
                p.fill(0); p.noStroke();
                if (emotion === 'confused') {
                    p.circle(-18, -10, 6); p.circle(22, -5, 6);
                } else if (emotion === 'angry') {
                    p.circle(-6, -8, 6); p.circle(10, -5, 6);
                } else {
                    p.circle(-10, -8, 6); p.circle(14, -7, 6);
                }
            } else {
                p.stroke(0); p.strokeWeight(3);
                p.line(-20, -10, -5, -10);
                p.line(10, -5, 25, -5);
            }

            p.stroke(0); p.strokeWeight(3);
            if (emotion === 'angry') {
                p.line(-25, -25, 25, -15);
            }
            if (isGirl && !isBlink) {
                p.strokeWeight(2);
                p.line(-24, -10, -32, -15);
                p.line(26, -5, 34, -10);
            }

            p.stroke(0); p.strokeWeight(3);
            if (emotion === 'normal') {
                p.line(-8, 15, 8, 15);
            } else if (emotion === 'happy') {
                p.fill(0); p.ellipse(0, 15, 12, 18);
            } else if (emotion === 'angry') {
                p.noFill(); p.arc(0, 18, 16, 10, p.PI, p.TWO_PI);
            } else if (emotion === 'sad') {
                p.fill(0); p.arc(0, 15, 20, 20, p.PI, p.TWO_PI);
                p.line(-10, 15, 10, 15);
            } else if (emotion === 'confused') {
                p.noFill(); p.circle(0, 15, 8);
            }
        },

        anime: (p, variant, emotion, isBlink) => {
            const isGirl = variant === 'girl';
            
            if (isGirl || emotion === 'happy') {
                p.noStroke(); p.fill(0, 50, 100, 0.4); 
                p.ellipse(-18, 5, 12, 6); p.ellipse(18, 5, 12, 6);
            }

            p.stroke(0); p.strokeWeight(isGirl ? 2 : 3);
            if (isBlink) {
                p.noFill(); p.arc(-16, -5, 16, 10, 0, p.PI); p.arc(16, -5, 16, 10, 0, p.PI);
            } else {
                if (emotion === 'happy') {
                    p.noFill();
                    p.arc(-16, -2, 14, 14, p.PI, p.TWO_PI);
                    p.arc(16, -2, 14, 14, p.PI, p.TWO_PI);
                } else if (emotion === 'confused') {
                    p.line(-22, -10, -10, 0); p.line(-10, -10, -22, 0);
                    p.line(10, -10, 22, 0); p.line(22, -10, 10, 0);
                } else if (emotion === 'sad') {
                    p.fill(0); p.noStroke();
                    p.ellipse(-16, -5, 14, 18); p.ellipse(16, -5, 14, 18);
                    p.fill(200, 50, 100); p.ellipse(-16, 5, 6, 10); p.ellipse(16, 5, 6, 10);
                } else if (emotion === 'angry') {
                    p.noFill(); p.stroke(0); p.strokeWeight(3);
                    p.line(-25, -12, -10, -5); p.line(25, -12, 10, -5);
                    p.fill(0); p.noStroke();
                    p.circle(-16, -2, 8); p.circle(16, -2, 8);
                } else {
                    p.fill(0); p.noStroke();
                    if (isGirl) {
                        p.ellipse(-16, -5, 14, 20); p.ellipse(16, -5, 14, 20);
                        p.fill(255); p.circle(-18, -10, 6); p.circle(14, -10, 6); p.circle(-14, 0, 3); p.circle(18, 0, 3);
                    } else {
                        p.ellipse(-16, -5, 12, 16); p.ellipse(16, -5, 12, 16);
                        p.fill(255); p.circle(-16, -8, 4); p.circle(16, -8, 4);
                    }
                }
            }

            p.stroke(0); p.strokeWeight(2);
            if (emotion === 'normal') {
                p.line(-4, 12, 4, 12);
            } else if (emotion === 'happy') {
                p.fill(0); p.arc(0, 10, 16, 16, 0, p.PI);
            } else if (emotion === 'angry') {
                p.fill(0); p.triangle(-6, 10, 6, 10, 0, 16);
            } else if (emotion === 'sad') {
                p.noFill(); p.arc(0, 14, 10, 8, p.PI, p.TWO_PI);
            } else if (emotion === 'confused') {
                p.noFill(); p.arc(0, 12, 12, 12, 0, p.PI);
            }
        }
    },

    // --- HATS ---
    hats: {
        none: (p, hue) => {},
        cap: (p, hue) => {
            p.fill(0, 0, 20);
            p.noStroke();
            p.arc(15, -35, 40, 10, 0, p.PI);
            p.fill(hue, 80, 95);
            p.arc(0, -35, 46, 40, p.PI, 0);
            p.fill(255);
            p.circle(0, -55, 6);
        },
        topHat: (p, hue) => {
            p.fill(0, 0, 15);
            p.noStroke();
            p.rect(-35, -45, 70, 10, 5);
            p.rect(-20, -85, 40, 45, 2);
            p.fill(hue, 80, 100);
            p.rect(-20, -55, 40, 10);
        },
        crown: (p, hue) => {
            p.fill(45, 100, 100);
            p.stroke(40, 100, 80); 
            p.strokeWeight(2);
            p.beginShape();
            p.vertex(-25, -35); p.vertex(25, -35);
            p.vertex(35, -65); p.vertex(10, -50); p.vertex(0, -70);
            p.vertex(-10, -50); p.vertex(-35, -65);
            p.endShape(p.CLOSE);
            
            p.fill(hue, 90, 100);
            p.noStroke();
            p.circle(0, -55, 8); p.circle(-18, -48, 6); p.circle(18, -48, 6);
        }
    },

    // --- MASKS ---
    masks: {
        none: (p, hue) => {},
        bandit: (p, hue) => {
            p.fill(0, 0, 15);
            p.stroke(hue, 80, 95);
            p.strokeWeight(2);
            p.rect(-45, -12, 90, 18, 4);
            p.fill(255); p.noStroke();
            p.ellipse(-15, -3, 16, 10); p.ellipse(15, -3, 16, 10);
        },
        bandana: (p, hue) => {
            p.fill(hue, 90, 80); // Darker, saturated player hue
            p.stroke(0, 0, 15);
            p.strokeWeight(2);
            
            // Main triangle covering mouth
            p.beginShape();
            p.vertex(-38, 5);
            p.vertex(38, 5);
            p.vertex(0, 40);
            p.endShape(p.CLOSE);
            
            // Knot ties hanging off the back side
            p.fill(hue, 90, 80);
            p.triangle(-35, 8, -50, 18, -35, 15);
            p.triangle(-35, 10, -45, 25, -30, 20);
        }
    },

    // --- BACK ACCESSORIES ---
    back: {
        none: (p, hue) => {},
        cape: (p, hue) => {
            p.fill(hue, 70, 80);
            p.noStroke();
            p.beginShape();
            p.vertex(-20, -20); p.vertex(20, -20);
            p.vertex(35, 50); p.vertex(10, 40); p.vertex(-10, 50); p.vertex(-35, 40);
            p.endShape(p.CLOSE);
            
            p.fill(hue, 90, 50);
            p.arc(0, -20, 40, 20, p.PI, 0);
        },
        backpack: (p, hue) => {
            p.fill(0, 0, 30);
            p.noStroke();
            p.rect(-45, -10, 90, 45, 10);
            
            p.fill(hue, 80, 95);
            p.rect(-45, 10, 15, 20, 4);
            p.rect(30, 10, 15, 20, 4);
        },
        wings: (p, hue) => {
            p.fill(0, 0, 100, 0.7);
            p.stroke(hue, 60, 100);
            p.strokeWeight(2);
            p.ellipse(-45, -10, 60, 30); p.ellipse(-35, 10, 40, 20);
            p.ellipse(45, -10, 60, 30);  p.ellipse(35, 10, 40, 20);
        }
    }
};
