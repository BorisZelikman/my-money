import {useState} from "react";
import {motion} from "framer-motion";
import "./Logo.css";

export const Logo = ({style}) => {
    const [rotate, setRotate] = useState(true);

    return (
        <div className = "container" style={style}>
            M
            <motion.p
                animate = {{x: 50}}
                transition = {{delay: 1, type: "tween", duration: 0.4}}
                initial = {{x: 0}}
            >
                Y
            </motion.p>
            <motion.div
                onClick = {() => setRotate(!rotate)}
                animate = {{x: -15, rotate: rotate ? 360 : 0}}
                transition = {{delay: 0.4, type: "tween", duration: 1}}
                initial = {{x: -300}}
                className = "coin"
            >
                ONE
            </motion.div>
        </div>
    );
};
