import {useState} from "react";
import {motion} from "framer-motion";
import "./Logo.css";

export const Logo = ({style, isBig}) => {
    const [rotate, setRotate] = useState(true);

    return (
        <div className = {isBig?"container font-big":"container"} style={style}>
            M
            <motion.p
                animate = {{x: isBig?92:50}}
                transition = {{
                    repeat: isBig?Infinity:0,
                    repeatType: isBig?'reverse':"loop",
                    repeatDelay: 0.7,
                    delay: isBig? 0.9:1,
                    duration: isBig?0.5:0.4,
                    type: "tween"
            }}
                initial = {{x: 0}}
            >
                Y
            </motion.p>
            <motion.div
                onClick = {() => setRotate(!rotate)}
                animate = {{x: isBig?-22: -15, rotate: rotate ? 360 : 0}}

                transition = {{
                    repeat: isBig?Infinity:0,
                    repeatType: isBig?'reverse':"loop",
                    repeatDelay: 0.2,
                    delay: 0.4, type: "tween", duration: 1}}

                initial = {{x: -300}}
                className = {isBig?"coin coin-big":"coin"}
            >
                ONE
            </motion.div>
        </div>
    );
};
